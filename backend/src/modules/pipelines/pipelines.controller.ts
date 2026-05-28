import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineSchema, CreatePipelineDto } from './dto/create-pipeline.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@prisma/client';

@Controller('pipelines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(CreatePipelineSchema))
  create(@Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(dto);
  }

  @Get()
  findAll() {
    return this.pipelinesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.pipelinesService.remove(id);
  }
}
