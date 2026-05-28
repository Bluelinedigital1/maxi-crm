import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { UsersModule } from '@modules/users/users.module';
import { EventsGateway } from '@gateways/events.gateway';
import { WebhookProcessor, WEBHOOK_QUEUE } from '@queues/webhook.processor';
import { WhatsappProcessor, WHATSAPP_QUEUE } from '@queues/whatsapp.processor';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: WEBHOOK_QUEUE },
      { name: WHATSAPP_QUEUE },
    ),
    JwtModule.register({}),
    WhatsappModule,
    MessagesModule,
    UsersModule,
  ],
  providers: [WebhooksService, WebhookProcessor, WhatsappProcessor, EventsGateway],
  controllers: [WebhooksController],
  exports: [EventsGateway],
})
export class WebhooksModule {}
