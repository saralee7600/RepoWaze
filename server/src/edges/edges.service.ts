import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IEdge } from '@repowaze/shared';
import { EdgeEntity } from './edge.entity';

@Injectable()
export class EdgesService {
  constructor(
    @InjectRepository(EdgeEntity)
    private readonly repo: Repository<EdgeEntity>,
  ) {}

  findAll(projectId?: number) {
    return this.repo.find({ where: projectId ? { projectId } : {} });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<IEdge>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<IEdge>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }
}
