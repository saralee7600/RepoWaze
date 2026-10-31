import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';

/** Single place that decides whether a user may touch a project (and, through it, its nodes and edges). */
@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
  ) {}

  /**
   * Resolves when `ownerId` owns the project. Throws 404 both when it doesn't exist and when it
   * belongs to someone else, so callers can't probe for other users' project ids.
   */
  async assertOwned(projectId: number, ownerId: string): Promise<void> {
    const isOwned = await this.repo.exists({
      where: { id: projectId, ownerId },
    });
    if (!isOwned) {
      throw new NotFoundException(`Project ${projectId} was not found`);
    }
  }
}
