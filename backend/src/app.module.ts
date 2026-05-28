import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { LeadsModule } from '@modules/leads/leads.module';
import { PipelinesModule } from '@modules/pipelines/pipelines.module';
import { StagesModule } from '@modules/stages/stages.module';
import { TagsModule } from '@modules/tags/tags.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { WebhooksModule } from '@modules/webhooks/webhooks.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LeadsModule,
    PipelinesModule,
    StagesModule,
    TagsModule,
    TasksModule,
    WhatsappModule,
    MessagesModule,
    WebhooksModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
