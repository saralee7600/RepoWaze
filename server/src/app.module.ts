import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { buildDatabaseOptions } from './config/database.config';
import { ProjectsModule } from './projects/projects.module';
import { NodesModule } from './nodes/nodes.module';
import { EdgesModule } from './edges/edges.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDatabaseOptions((key) => config.get<string>(key)),
    }),
    AuthModule,
    ProjectsModule,
    NodesModule,
    EdgesModule,
  ],
})
export class AppModule {}
