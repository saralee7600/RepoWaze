import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectEntity } from './project.entity';
import { GithubService } from './github.service';
import { EntityParserService } from './entity-parser.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity])],
  providers: [ProjectsService, GithubService, EntityParserService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
