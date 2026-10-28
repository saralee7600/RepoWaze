import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { NodeEntity } from './node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity])],
  providers: [NodesService],
  controllers: [NodesController],
})
export class NodesModule {}
