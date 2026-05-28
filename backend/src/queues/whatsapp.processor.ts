import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@prisma/prisma.service';
import { MessagesService } from '@modules/messages/messages.service';
import { EventsGateway } from '@gateways/events.gateway';

export const WHATSAPP_QUEUE = 'whatsapp';

export interface InboundMessageJob {
  instanceId: string;
  phone: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: string;
}

@Processor(WHATSAPP_QUEUE)
export class WhatsappProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<InboundMessageJob>) {
    const { instanceId, phone, body, mediaUrl, mediaType } = job.data;

    let lead = await this.prisma.lead.findFirst({ where: { phone } });

    if (!lead) {
      const instance = await this.prisma.whatsappInstance.findUnique({
        where: { id: instanceId },
      });
      if (!instance) {
        this.logger.warn(`Instância ${instanceId} não encontrada`);
        return;
      }

      const firstStage = await this.prisma.stage.findFirst({
        orderBy: [{ pipeline: { createdAt: 'asc' } }, { position: 'asc' }],
      });

      if (!firstStage) {
        this.logger.error('Nenhuma stage encontrada para atribuir o lead');
        return;
      }

      const assignedUserId = instance.userId;

      lead = await this.prisma.lead.create({
        data: {
          name: phone,
          phone,
          source: 'WhatsApp',
          currentStageId: firstStage.id,
          assignedUserId,
        },
      });

      this.logger.log(`Novo lead criado via WhatsApp: ${lead.id}`);
    }

    const message = await this.messagesService.createInbound({
      leadId: lead.id,
      whatsappInstanceId: instanceId,
      body,
      mediaUrl,
      mediaType,
    });

    this.eventsGateway.emitNewMessage(lead.assignedUserId, {
      leadId: lead.id,
      leadName: lead.name,
      message,
    });
  }
}
