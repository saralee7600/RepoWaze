import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { INode } from '@repowaze/shared';
import { pickDefined } from '../common/pick-defined';
import { ProjectAccessService } from '../projects/project-access.service';
import { NodeEntity } from './node.entity';

const EDITABLE_FIELDS = ['projectId', 'label', 'type', 'metadata'] as const;

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly repo: Repository<NodeEntity>,
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

  findOne(id: number, ownerId: string): Promise<NodeEntity> {
    return this.findOwned(id, ownerId);
  }

  async create(ownerId: string, data: Partial<INode>) {
    if (typeof data.projectId !== 'number') {
      throw new BadRequestException('projectId is required');
    }
    await this.access.assertOwned(data.projectId, ownerId);

    const entity = this.repo.create(pickDefined(data, EDITABLE_FIELDS));
    return this.repo.save(entity);
  }

  async update(id: number, ownerId: string, data: Partial<INode>) {
    const node = await this.findOwned(id, ownerId);
    const changes = pickDefined(data, EDITABLE_FIELDS);

    if (
      changes.projectId !== undefined &&
      changes.projectId !== node.projectId
    ) {
      await this.access.assertOwned(changes.projectId, ownerId);
    }
    if (Object.keys(changes).length > 0) {
      await this.repo.update(id, changes as QueryDeepPartialEntity<NodeEntity>);
    }
    return this.findOwned(id, ownerId);
  }

  async delete(id: number, ownerId: string): Promise<void> {
    await this.findOwned(id, ownerId);
    await this.repo.delete(id);
  }

  private async findOwned(id: number, ownerId: string): Promise<NodeEntity> {
    const node = await this.repo.findOne({
      where: { id, project: { ownerId } },
    });
    if (!node) throw new NotFoundException(`Node ${id} was not found`);
    return node;
  }
}
