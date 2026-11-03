import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { IProject, IProjectSummary } from '@repowaze/shared';
import { pickDefined } from '../common/pick-defined';
import { ProjectAccessService } from './project-access.service';
import { saveGraph, toRepoUrl } from './project-graph.persistence';
import { ProjectEntity } from './project.entity';
import { NodeEntity } from '../nodes/node.entity';
import { EdgeEntity } from '../edges/edge.entity';
import { GithubService } from './github.service';
import { EntityParserService } from './entity-parser.service';
import { ImportProjectDto } from './dto/import-project.dto';
import type { GithubRepoRef } from './github.types';
import type { ParsedEntityGraph } from './parsed-entity.types';

const MAX_NAME_LENGTH = 255;

const EDITABLE_FIELDS = ['repoUrl', 'repoName'] as const;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
    private readonly dataSource: DataSource,
    private readonly github: GithubService,
    private readonly parser: EntityParserService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAll(ownerId: string): Promise<IProjectSummary[]> {
    const [projects, nodeCounts, edgeCounts] = await Promise.all([
      this.repo.find({
        where: { ownerId },
        order: { createdAt: 'DESC', id: 'DESC' },
      }),
      this.countByProject(NodeEntity, 'node', ownerId),
      this.countByProject(EdgeEntity, 'edge', ownerId),
    ]);

    return projects.map((project) => ({
      id: project.id,
      repoUrl: project.repoUrl,
      repoName: project.repoName,
      createdAt: project.createdAt,
      nodeCount: nodeCounts.get(project.id) ?? 0,
      edgeCount: edgeCounts.get(project.id) ?? 0,
    }));
  }

  async findOne(id: number, ownerId: string): Promise<ProjectEntity> {
    const project = await this.repo.findOne({
      where: { id, ownerId },
      relations: { nodes: true, edges: true },
      order: { nodes: { id: 'ASC' }, edges: { id: 'ASC' } },
    });
    if (!project) {
      throw new NotFoundException(`Project ${id} was not found`);
    }
    return project;
  }

  private async countByProject(
    target: typeof NodeEntity | typeof EdgeEntity,
    alias: string,
    ownerId: string,
  ): Promise<Map<number, number>> {
    const rows = await this.dataSource
      .getRepository(target)
      .createQueryBuilder(alias)
      .innerJoin(`${alias}.project`, 'project')
      .where('project.ownerId = :ownerId', { ownerId })
      .select(`${alias}.projectId`, 'projectId')
      .addSelect('COUNT(*)', 'total')
      .groupBy(`${alias}.projectId`)
      .getRawMany<{ projectId: number | string; total: number | string }>();

    return new Map(
      rows.map((row) => [Number(row.projectId), Number(row.total)]),
    );
  }

  async create(ownerId: string, data: Partial<IProject>) {
    const entity = this.repo.create({
      ...pickDefined(data, EDITABLE_FIELDS),
      ownerId,
    });
    return this.repo.save(entity);
  }

  async update(id: number, ownerId: string, data: Partial<IProject>) {
    await this.access.assertOwned(id, ownerId);
    const changes = pickDefined(data, EDITABLE_FIELDS);
    if (Object.keys(changes).length > 0) {
      await this.repo.update({ id, ownerId }, changes);
    }
    return this.findOne(id, ownerId);
  }

  async delete(id: number, ownerId: string): Promise<void> {
    await this.access.assertOwned(id, ownerId);
    await this.repo.delete({ id, ownerId });
  }

  async importFromGithub(
    dto: ImportProjectDto,
    ownerId: string,
  ): Promise<ProjectEntity> {
    const { repoUrl, name } = this.validateImportRequest(dto);

    const ref = this.github.parseRepoUrl(repoUrl);
    await this.assertNotImported(ref, ownerId);

    const graph = await this.loadGraph(ref);
    const projectId = await this.persistGraph(ref, name, graph, ownerId);
    this.logger.log(
      `Imported ${ref.owner}/${ref.repo} as project ${projectId}: ${graph.nodes.length} node(s), ${graph.edges.length} edge(s)`,
    );

    return this.findOne(projectId, ownerId);
  }

  /**
   * Re-reads the repository behind an existing project and replaces its nodes
   * and edges with the current state. The project itself (id, name, owner,
   * creation date) is kept. If the repository can no longer be analysed, the
   * existing data is left untouched.
   */
  async syncFromGithub(id: number, ownerId: string): Promise<ProjectEntity> {
    await this.access.assertOwned(id, ownerId);
    const project = await this.repo.findOneOrFail({
      where: { id, ownerId },
    });

    const ref = this.github.parseRepoUrl(project.repoUrl);
    const graph = await this.loadGraph(ref);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EdgeEntity, { projectId: id });
      await manager.delete(NodeEntity, { projectId: id });
      await saveGraph(manager, id, graph);
    });
    this.logger.log(
      `Synced project ${id} (${ref.owner}/${ref.repo}): ${graph.nodes.length} node(s), ${graph.edges.length} edge(s)`,
    );

    return this.findOne(id, ownerId);
  }

  private async assertNotImported(
    ref: GithubRepoRef,
    ownerId: string,
  ): Promise<void> {
    const existing = await this.repo.findOne({
      where: { ownerId, repoUrl: toRepoUrl(ref) },
    });
    if (existing) {
      throw new ConflictException(
        `${ref.owner}/${ref.repo} is already imported as "${existing.repoName}". Open that project and use Sync to pick up new changes.`,
      );
    }
  }

  private async loadGraph(ref: GithubRepoRef): Promise<ParsedEntityGraph> {
    const files = await this.github.fetchEntityFiles(ref);
    if (files.length === 0) {
      throw new UnprocessableEntityException(
        `No *.entity.ts files were found in ${ref.owner}/${ref.repo}`,
      );
    }

    const graph = this.parser.parse(files);
    if (graph.nodes.length === 0) {
      throw new UnprocessableEntityException(
        `Found ${files.length} entity file(s) in ${ref.owner}/${ref.repo}, but none declares an @Entity() class`,
      );
    }
    return graph;
  }

  private validateImportRequest(dto: ImportProjectDto): {
    repoUrl: string;
    name: string | undefined;
  } {
    if (typeof dto?.repoUrl !== 'string' || dto.repoUrl.trim() === '') {
      throw new BadRequestException(
        'repoUrl is required and must be a non-empty string',
      );
    }
    if (dto.name !== undefined && typeof dto.name !== 'string') {
      throw new BadRequestException('name must be a string');
    }
    const name = dto.name?.trim() || undefined;
    if (name && name.length > MAX_NAME_LENGTH) {
      throw new BadRequestException(
        `name must be at most ${MAX_NAME_LENGTH} characters`,
      );
    }
    return { repoUrl: dto.repoUrl, name };
  }

  private async persistGraph(
    ref: GithubRepoRef,
    name: string | undefined,
    graph: ParsedEntityGraph,
    ownerId: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const project = await manager.save(
        manager.create(ProjectEntity, {
          repoUrl: toRepoUrl(ref),
          repoName: name ?? `${ref.owner}/${ref.repo}`,
          ownerId,
        }),
      );
      await saveGraph(manager, project.id, graph);
      return project.id;
    });
  }
}
