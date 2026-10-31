import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { IEdge } from '@repowaze/shared';
import { pickDefined } from '../common/pick-defined';
import { NodeEntity } from '../nodes/node.entity';
import { ProjectAccessService } from '../projects/project-access.service';
import { EdgeEntity } from './edge.entity';

/** Edge columns a client may write; `id` is server-controlled. */
const EDITABLE_FIELDS = [
  'projectId',
  'sourceNodeId',
  'targetNodeId',
  'relationType',
  'label',
] as const;

/** Every method is scoped to edges whose parent project belongs to `ownerId`. */
@Injectable()
export class EdgesService {
  constructor(
    @InjectRepository(EdgeEntity)
    private readonly repo: Repository<EdgeEntity>,
    @InjectRepository(NodeEntity)
    private readonly nodes: Repository<NodeEntity>,
    private readonly access: ProjectAccessService,
  ) {}

  async findAll(ownerId: string, projectId?: number) {
    if (projectId !== undefined) {
      await this.access.assertOwned(projectId, ownerId);
    }
    return this.repo.find({
      where: {
        project: { ownerId },
        ...(projectId !== undefined && { projectId }),
      },
    });
  }

  findOne(id: number, ownerId: string): Promise<EdgeEntity> {
    return this.findOwned(id, ownerId);
  }

  async create(ownerId: string, data: Partial<IEdge>) {
    const { projectId, sourceNodeId, targetNodeId } = data;
    if (
      typeof projectId !== 'number' ||
      typeof sourceNodeId !== 'number' ||
      typeof targetNodeId !== 'number'
    ) {
      throw new BadRequestException(
        'projectId, sourceNodeId and targetNodeId are required',
      );
    }
    await this.access.assertOwned(projectId, ownerId);
    await this.assertNodesInProject(projectId, [sourceNodeId, targetNodeId]);

    const entity = this.repo.create(pickDefined(data, EDITABLE_FIELDS));
    return this.repo.save(entity);
  }

  async update(id: number, ownerId: string, data: Partial<IEdge>) {
    const edge = await this.findOwned(id, ownerId);
    const changes = pickDefined(data, EDITABLE_FIELDS);

    const projectId = changes.projectId ?? edge.projectId;
    if (projectId !== edge.projectId) {
      await this.access.assertOwned(projectId, ownerId);
    }
    await this.assertNodesInProject(projectId, [
      changes.sourceNodeId ?? edge.sourceNodeId,
      changes.targetNodeId ?? edge.targetNodeId,
    ]);

    if (Object.keys(changes).length > 0) {
      await this.repo.update(id, changes);
    }
    return this.findOwned(id, ownerId);
  }

  async delete(id: number, ownerId: string): Promise<void> {
    await this.findOwned(id, ownerId);
    await this.repo.delete(id);
  }

  private async findOwned(id: number, ownerId: string): Promise<EdgeEntity> {
    const edge = await this.repo.findOne({
      where: { id, project: { ownerId } },
    });
    if (!edge) throw new NotFoundException(`Edge ${id} was not found`);
    return edge;
  }

  /** An edge may only connect nodes of its own project, never ones from another user's graph. */
  private async assertNodesInProject(
    projectId: number,
    nodeIds: number[],
  ): Promise<void> {
    const uniqueIds = [...new Set(nodeIds)];
    const found = await this.nodes.count({
      where: { id: In(uniqueIds), projectId },
    });
    if (found !== uniqueIds.length) {
      throw new BadRequestException(
        'sourceNodeId and targetNodeId must be nodes of the edge’s project',
      );
    }
  }
}
