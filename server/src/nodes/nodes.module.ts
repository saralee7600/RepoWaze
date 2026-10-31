import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { NodeEntity } from './node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity]), ProjectsModule],
  providers: [NodesService],
  controllers: [NodesController],
})
export class NodesModule {}
