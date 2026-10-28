import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EdgesService } from './edges.service';
import type { IEdge } from '@repowaze/shared';

@Controller('edges')
export class EdgesController {
  constructor(private readonly service: EdgesService) {}

  @Get()
  findAll(@Query('projectId') projectId?: number) {
    return this.service.findAll(projectId ? +projectId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() body: Partial<IEdge>) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: Partial<IEdge>) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
