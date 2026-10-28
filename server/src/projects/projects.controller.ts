import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { IProject } from '@repowaze/shared';
import { ImportProjectDto } from './dto/import-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  /** Imports a GitHub repository's TypeORM entities as a project graph. */
  @Post('import')
  importFromGithub(@Body() body: ImportProjectDto) {
    return this.service.importFromGithub(body);
  }

  @Post()
  create(@Body() body: Partial<IProject>) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: Partial<IProject>) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
