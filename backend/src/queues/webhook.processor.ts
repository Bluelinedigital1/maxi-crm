import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@prisma/prisma.service';
import { UsersService } from '@modules/users/users.service';

export const WEBHOOK_QUEUE = 'webhook';

export interface WebhookLeadJob {
  name: string;
  phone: string;
  email?: string;
  source: string;
  stageId: string;
  rawPayload: Record<string, unknown>;
}

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {
    super();
  }

  async process(job: Job<WebhookLeadJob>) {
    const { name, phone, email, source, stageId, rawPayload } = job.data;

    const existing = await this.prisma.lead.findFirst({ where: { phone } });
    if (existing) {
      this.logger.log(`Lead já existe para ${phone} — ignorando`);
      return { skipped: true, leadId: existing.id };
    }

    const assignedUserId = await this.usersService.getNextRoundRobin();

    const lead = await this.prisma.lead.create({
      data: { name, phone, email, source, currentStageId: stageId, assignedUserId },
    });

    this.logger.log(`Lead criado via ${source}: ${lead.id} → vendedor ${assignedUserId}`);
    return { created: true, leadId: lead.id };
  }
}
