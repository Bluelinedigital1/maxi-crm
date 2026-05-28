import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_INCLUDE = {
  assignedUser: { select: { id: true, name: true, email: true } },
  lead: { select: { id: true, name: true, phone: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...dto, dueDate: new Date(dto.dueDate) },
      include: TASK_INCLUDE,
    });
  }

  findByLead(leadId: string) {
    return this.prisma.task.findMany({
      where: { leadId },
      include: TASK_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  findByUser(assignedUserId: string) {
    return this.prisma.task.findMany({
      where: { assignedUserId },
      include: TASK_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  findOverdue() {
    return this.prisma.task.findMany({
      where: { status: 'PENDING', dueDate: { lt: new Date() } },
      include: TASK_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    return this.prisma.task.update({
      where: { id },
      data: { ...dto, ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }) },
      include: TASK_INCLUDE,
    });
  }

  async complete(id: string) {
    return this.update(id, { status: 'COMPLETED' });
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.task.delete({ where: { id } });
  }
}
