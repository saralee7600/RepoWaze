import {
  BadRequestException,
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
      ...pickDefined(data, EDITABLE_FIELDS as unknown as readonly (keyof typeof data)[]),
      ownerId,
    });
    return this.repo.save(entity);
  }

  async update(id: number, ownerId: string, data: Partial<IProject>) {
    await this.access.assertOwned(id, ownerId);
    const changes = pickDefined(data, EDITABLE_FIELDS as unknown as readonly (keyof typeof data)[]);
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

    const projectId = await this.persistGraph(ref, name, graph, ownerId);
    this.logger.log(
      `Imported ${ref.owner}/${ref.repo} as project ${projectId}: ${graph.nodes.length} node(s), ${graph.edges.length} edge(s)`,
    );

    return this.repo.findOneOrFail({
      where: { id: projectId },
      relations: { nodes: true, edges: true },
      order: { nodes: { id: 'ASC' }, edges: { id: 'ASC' } },
    });
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
          repoUrl: `https://github.com/${ref.owner}/${ref.repo}`,
          repoName: name ?? `${ref.owner}/${ref.repo}`,
          ownerId,
        }),
      );

      const nodes = await manager.save(
        graph.nodes.map((node) =>
          manager.create(NodeEntity, {
            projectId: project.id,
            label: node.className,
            type: 'entity',
            metadata: node.metadata,
          }),
        ),
      );

      const nodeIdByClass = new Map<string, number>();
      nodes.forEach((saved, index) => {
        nodeIdByClass.set(graph.nodes[index].className, saved.id);
      });

      const edges = graph.edges.flatMap((edge) => {
        const sourceNodeId = nodeIdByClass.get(edge.sourceClass);
        const targetNodeId = nodeIdByClass.get(edge.targetClass);
        if (sourceNodeId === undefined || targetNodeId === undefined) return [];

        return manager.create(EdgeEntity, {
          projectId: project.id,
          sourceNodeId,
          targetNodeId,
          relationType: edge.relationType,
          label: edge.label,
        });
      });
      await manager.save(edges);

      return project.id;
    });
  }
}
