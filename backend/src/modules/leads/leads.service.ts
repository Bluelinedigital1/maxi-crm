import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { UsersService } from '@modules/users/users.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { Role } from '@prisma/client';

const LEAD_INCLUDE = {
  assignedUser: { select: { id: true, name: true, email: true, role: true } },
  currentStage: { select: { id: true, name: true, position: true, pipelineId: true } },
  tags: { include: { tag: true } },
  tasks: { where: { status: 'PENDING' as const }, orderBy: { dueDate: 'asc' as const } },
  _count: { select: { messages: true } },
} as const;

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateLeadDto) {
    const assignedUserId = dto.assignedUserId ?? await this.usersService.getNextRoundRobin();

    return this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        companyName: dto.companyName,
        source: dto.source,
        currentStageId: dto.currentStageId,
        assignedUserId,
      },
      include: LEAD_INCLUDE,
    });
  }

  findAll(filters?: { assignedUserId?: string; stageId?: string; source?: string }) {
    return this.prisma.lead.findMany({
      where: {
        ...(filters?.assignedUserId && { assignedUserId: filters.assignedUserId }),
        ...(filters?.stageId && { currentStageId: filters.stageId }),
        ...(filters?.source && { source: filters.source }),
      },
      include: LEAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: LEAD_INCLUDE });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  async findByPhone(phone: string) {
    return this.prisma.lead.findFirst({ where: { phone }, include: LEAD_INCLUDE });
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.prisma.lead.update({ where: { id }, data: dto, include: LEAD_INCLUDE });
  }

  async moveStage(id: string, dto: MoveStageDto) {
    const lead = await this.findOne(id);

    const stage = await this.prisma.stage.findUnique({ where: { id: dto.stageId } });
    if (!stage) throw new NotFoundException('Stage não encontrado');

    return this.prisma.lead.update({
      where: { id },
      data: { currentStageId: dto.stageId },
      include: LEAD_INCLUDE,
    });
  }

  async assignTag(leadId: string, tagId: string) {
    await this.findOne(leadId);
    return this.prisma.leadTag.upsert({
      where: { leadId_tagId: { leadId, tagId } },
      create: { leadId, tagId },
      update: {},
    });
  }

  async removeTag(leadId: string, tagId: string) {
    await this.findOne(leadId);
    return this.prisma.leadTag.delete({ where: { leadId_tagId: { leadId, tagId } } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  findForSeller(userId: string, role: Role) {
    if (role === 'SELLER') {
      return this.findAll({ assignedUserId: userId });
    }
    return this.findAll();
  }
}
