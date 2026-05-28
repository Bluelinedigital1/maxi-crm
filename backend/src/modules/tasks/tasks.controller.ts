import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UsePipes,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskSchema, CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskSchema, UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role, User } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get('lead/:leadId')
  findByLead(@Param('leadId') leadId: string) {
    return this.tasksService.findByLead(leadId);
  }

  @Get('my')
  findMine(@CurrentUser() user: User) {
    return this.tasksService.findByUser(user.id);
  }

  @Get('overdue')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOverdue() {
    return this.tasksService.findOverdue();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.tasksService.complete(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
