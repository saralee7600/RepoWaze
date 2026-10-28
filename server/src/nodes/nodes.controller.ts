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
import { NodesService } from './nodes.service';
import type { INode } from '@repowaze/shared';

@Controller('nodes')
export class NodesController {
  constructor(private readonly service: NodesService) {}

  @Get()
  findAll(@Query('projectId') projectId?: number) {
    return this.service.findAll(projectId ? +projectId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() body: Partial<INode>) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: Partial<INode>) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(+id);
  }
}
