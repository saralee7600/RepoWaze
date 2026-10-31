import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
  ) {}

  async assertOwned(projectId: number, ownerId: string): Promise<void> {
    const isOwned = await this.repo.exists({
      where: { id: projectId, ownerId },
    });
    if (!isOwned) {
      throw new NotFoundException(`Project ${projectId} was not found`);
    }
  }
}
