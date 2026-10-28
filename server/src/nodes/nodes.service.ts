import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { INode } from '@repowaze/shared';
import { NodeEntity } from './node.entity';

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly repo: Repository<NodeEntity>,
  ) {}

  findAll(projectId?: number) {
    return this.repo.find({ where: projectId ? { projectId } : {} });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<INode>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<INode>) {
    // TypeORM's update() typing can't express a Record<string, unknown> JSON column.
    await this.repo.update(id, data as QueryDeepPartialEntity<NodeEntity>);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }
}
