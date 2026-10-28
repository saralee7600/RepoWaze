import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { NodesModule } from './nodes/nodes.module';
import { EdgesModule } from './edges/edges.module';
import { ProjectEntity } from './projects/project.entity';
import { NodeEntity } from './nodes/node.entity';
import { EdgeEntity } from './edges/edge.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [ProjectEntity, NodeEntity, EdgeEntity],
        // Development only: auto-creates/updates tables from the entities.
        synchronize: true,
      }),
    }),
    ProjectsModule,
    NodesModule,
    EdgesModule,
  ],
})
export class AppModule {}
