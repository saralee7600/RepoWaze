import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EdgesService } from './edges.service';
import { EdgesController } from './edges.controller';
import { EdgeEntity } from './edge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EdgeEntity])],
  providers: [EdgesService],
  controllers: [EdgesController],
})
export class EdgesModule {}
