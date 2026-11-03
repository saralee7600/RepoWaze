import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProjectsService } from './projects.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { IMPORT_THROTTLE } from '../config/throttle.config';
import { CreateProjectDto } from './dto/create-project.dto';
import { ImportProjectDto } from './dto/import-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(id, user.id);
  }

  // Each import fans out to many GitHub API calls, so it gets a tighter limit.
  @Post('import')
  @Throttle({ default: IMPORT_THROTTLE })
  importFromGithub(
    @Body() body: ImportProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.importFromGithub(body, user.id);
  }

  // Re-reads the repository and refreshes the project's nodes and edges.
  @Post(':id/sync')
  @Throttle({ default: IMPORT_THROTTLE })
  syncFromGithub(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.syncFromGithub(id, user.id);
  }

  @Post()
  create(
    @Body() body: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.delete(id, user.id);
  }
}
