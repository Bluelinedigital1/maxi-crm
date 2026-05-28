import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { StagesService } from './stages.service';
import { CreateStageSchema, CreateStageDto } from './dto/create-stage.dto';
import { ReorderStagesSchema, ReorderStagesDto } from './dto/reorder-stages.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@prisma/client';

@Controller('stages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(CreateStageSchema))
  create(@Body() dto: CreateStageDto) {
    return this.stagesService.create(dto);
  }

  @Get('pipeline/:pipelineId')
  findByPipeline(@Param('pipelineId') pipelineId: string) {
    return this.stagesService.findByPipeline(pipelineId);
  }

  @Patch('pipeline/:pipelineId/reorder')
  @Roles(Role.ADMIN, Role.MANAGER)
  reorder(
    @Param('pipelineId') pipelineId: string,
    @Body(new ZodValidationPipe(ReorderStagesSchema)) dto: ReorderStagesDto,
  ) {
    return this.stagesService.reorder(pipelineId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.stagesService.remove(id);
  }
}
