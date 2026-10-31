import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeEntity } from '../nodes/node.entity';
import { ProjectsModule } from '../projects/projects.module';
import { EdgesService } from './edges.service';
import { EdgesController } from './edges.controller';
import { EdgeEntity } from './edge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EdgeEntity, NodeEntity]), ProjectsModule],
  providers: [EdgesService],
  controllers: [EdgesController],
})
export class EdgesModule {}
