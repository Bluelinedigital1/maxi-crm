import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UsePipes,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadSchema, CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadSchema, UpdateLeadDto } from './dto/update-lead.dto';
import { MoveStageSchema, MoveStageDto } from './dto/move-stage.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role, User } from '@prisma/client';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateLeadSchema))
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('stageId') stageId?: string,
    @Query('source') source?: string,
    @Query('assignedUserId') assignedUserId?: string,
  ) {
    if (user.role === Role.SELLER) {
      return this.leadsService.findAll({ assignedUserId: user.id, stageId, source });
    }
    return this.leadsService.findAll({ assignedUserId, stageId, source });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateLeadSchema)) dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, dto);
  }

  @Patch(':id/move')
  moveStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveStageSchema)) dto: MoveStageDto,
  ) {
    return this.leadsService.moveStage(id, dto);
  }

  @Post(':id/tags/:tagId')
  assignTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.leadsService.assignTag(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  removeTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.leadsService.removeTag(id, tagId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
