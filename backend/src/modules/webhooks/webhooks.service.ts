import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@prisma/prisma.service';
import { WhatsappService } from '@modules/whatsapp/whatsapp.service';
import { EventsGateway } from '@gateways/events.gateway';
import { WEBHOOK_QUEUE, WebhookLeadJob } from '@queues/webhook.processor';
import { WHATSAPP_QUEUE, InboundMessageJob } from '@queues/whatsapp.processor';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue(WEBHOOK_QUEUE) private webhookQueue: Queue<WebhookLeadJob>,
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue<InboundMessageJob>,
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private eventsGateway: EventsGateway,
  ) {}

  async handleFacebookLead(payload: Record<string, unknown>) {
    const entry = (payload as any)?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes?.leadgen_id) {
      this.logger.warn('Payload Facebook sem leadgen_id');
      return { ok: true };
    }

    const fieldData: Array<{ name: string; values: string[] }> = changes.field_data ?? [];
    const get = (key: string) => fieldData.find((f) => f.name === key)?.values?.[0] ?? '';

    const firstStage = await this.prisma.stage.findFirst({
      orderBy: [{ pipeline: { createdAt: 'asc' } }, { position: 'asc' }],
    });

    if (!firstStage) throw new BadRequestException('Nenhuma stage configurada');

    const job: WebhookLeadJob = {
      name: get('full_name') || get('name') || 'Lead Facebook',
      phone: get('phone_number') || get('phone'),
      email: get('email') || undefined,
      source: 'Facebook',
      stageId: firstStage.id,
      rawPayload: payload,
    };

    await this.webhookQueue.add('create-lead', job, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    this.logger.log(`Lead Facebook enfileirado: ${job.name}`);
    return { ok: true };
  }

  async handleWebsiteLead(payload: Record<string, unknown>) {
    const firstStage = await this.prisma.stage.findFirst({
      orderBy: [{ pipeline: { createdAt: 'asc' } }, { position: 'asc' }],
    });

    if (!firstStage) throw new BadRequestException('Nenhuma stage configurada');

    const job: WebhookLeadJob = {
      name: String(payload.name ?? 'Lead Website'),
      phone: String(payload.phone ?? ''),
      email: payload.email ? String(payload.email) : undefined,
      source: 'Website',
      stageId: firstStage.id,
      rawPayload: payload,
    };

    if (!job.phone) throw new BadRequestException('Campo phone obrigatório');

    await this.webhookQueue.add('create-lead', job, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    this.logger.log(`Lead Website enfileirado: ${job.name}`);
    return { ok: true };
  }

  async handleEvolutionWebhook(instanceId: string, payload: Record<string, unknown>) {
    const event = payload.event as string;

    if (event === 'connection.update') {
      const state = (payload as any)?.data?.state;
      const status = state === 'open' ? 'CONNECTED' : 'DISCONNECTED';
      await this.whatsappService.handleConnectionUpdate(instanceId, status);
      this.eventsGateway.emitLeadCreated({ type: 'instance:status', instanceId, status });
      return { ok: true };
    }

    if (event === 'messages.upsert') {
      const msg = (payload as any)?.data?.messages?.[0];
      if (!msg || msg.key?.fromMe) return { ok: true };

      const phone = (msg.key?.remoteJid as string)?.replace('@s.whatsapp.net', '') ?? '';
      const body = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '';

      if (!phone || !body) return { ok: true };

      const job: InboundMessageJob = {
        instanceId,
        phone,
        body,
        mediaUrl: msg.message?.imageMessage?.url,
        mediaType: msg.message?.imageMessage ? 'image' : undefined,
        timestamp: new Date().toISOString(),
      };

      await this.whatsappQueue.add('inbound-message', job, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
      return { ok: true };
    }

    return { ok: true };
  }
}
