import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PipelineType } from '@prisma/client';

interface DateRange {
  from: Date;
  to: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(range: DateRange) {
    const { from, to } = range;
    const where = { createdAt: { gte: from, lte: to } };

    const [
      totalLeads,
      leadsBySource,
      leadsByStage,
      tasksPending,
      tasksOverdue,
      messagesInbound,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.lead.groupBy({
        by: ['currentStageId'],
        where,
        _count: { id: true },
      }),
      this.prisma.task.count({ where: { status: 'PENDING' } }),
      this.prisma.task.count({ where: { status: 'PENDING', dueDate: { lt: new Date() } } }),
      this.prisma.message.count({ where: { direction: 'INBOUND', timestamp: { gte: from, lte: to } } }),
    ]);

    const stageIds = leadsByStage.map((s) => s.currentStageId);
    const stages = await this.prisma.stage.findMany({
      where: { id: { in: stageIds } },
      select: { id: true, name: true },
    });
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s.name]));

    return {
      totalLeads,
      leadsBySource: leadsBySource.map((s) => ({ source: s.source, count: s._count.id })),
      leadsByStage: leadsByStage.map((s) => ({
        stageId: s.currentStageId,
        stageName: stageMap[s.currentStageId] ?? 'Desconhecida',
        count: s._count.id,
      })),
      tasks: { pending: tasksPending, overdue: tasksOverdue },
      messagesInbound,
    };
  }

  async getSellerPerformance(range: DateRange) {
    const { from, to } = range;

    const sellers = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['SELLER', 'MANAGER'] } },
      select: { id: true, name: true, email: true, role: true },
    });

    const performance = await Promise.all(
      sellers.map(async (seller) => {
        const [totalLeads, leadsByStage, completedTasks, messagesHandled] = await Promise.all([
          this.prisma.lead.count({
            where: { assignedUserId: seller.id, createdAt: { gte: from, lte: to } },
          }),
          this.prisma.lead.groupBy({
            by: ['currentStageId'],
            where: { assignedUserId: seller.id },
            _count: { id: true },
          }),
          this.prisma.task.count({
            where: { assignedUserId: seller.id, status: 'COMPLETED', updatedAt: { gte: from, lte: to } },
          }),
          this.prisma.message.count({
            where: {
              direction: 'OUTBOUND',
              timestamp: { gte: from, lte: to },
              lead: { assignedUserId: seller.id },
            },
          }),
        ]);

        const wonStages = await this.prisma.stage.findMany({
          where: { name: { contains: 'ganho', mode: 'insensitive' } },
          select: { id: true },
        });
        const wonStageIds = new Set(wonStages.map((s) => s.id));
        const wonLeads = leadsByStage
          .filter((l) => wonStageIds.has(l.currentStageId))
          .reduce((acc, l) => acc + l._count.id, 0);

        const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

        return {
          seller: { id: seller.id, name: seller.name, email: seller.email, role: seller.role },
          totalLeads,
          wonLeads,
          conversionRate,
          completedTasks,
          messagesHandled,
        };
      }),
    );

    return performance.sort((a, b) => b.totalLeads - a.totalLeads);
  }

  async getConsignmentField() {
    const consignmentPipeline = await this.prisma.pipeline.findFirst({
      where: { type: PipelineType.CONSIGNMENT },
      include: { stages: { orderBy: { position: 'asc' } } },
    });

    if (!consignmentPipeline) return { inFieldLeads: 0, stages: [] };

    const inFieldStages = consignmentPipeline.stages.filter((s) =>
      s.name.toLowerCase().includes('campo') || s.name.toLowerCase().includes('alocad'),
    );

    const inFieldLeadsCount = await this.prisma.lead.count({
      where: { currentStageId: { in: inFieldStages.map((s) => s.id) } },
    });

    const stagesWithCount = await Promise.all(
      consignmentPipeline.stages.map(async (stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        position: stage.position,
        leadCount: await this.prisma.lead.count({ where: { currentStageId: stage.id } }),
      })),
    );

    return {
      inFieldLeads: inFieldLeadsCount,
      stages: stagesWithCount,
    };
  }

  async getLeadsTrend(range: DateRange, groupBy: 'day' | 'week' | 'month' = 'day') {
    const { from, to } = range;

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, source: true },
      orderBy: { createdAt: 'asc' },
    });

    const format = (date: Date) => {
      if (groupBy === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (groupBy === 'week') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    };

    const grouped: Record<string, number> = {};
    for (const lead of leads) {
      const key = format(lead.createdAt);
      grouped[key] = (grouped[key] ?? 0) + 1;
    }

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
