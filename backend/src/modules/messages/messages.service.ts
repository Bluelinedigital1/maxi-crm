import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

const MESSAGE_INCLUDE = {
  whatsappInstance: { select: { id: true, name: true, phoneNumber: true } },
} as const;

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  findByLead(leadId: string) {
    return this.prisma.message.findMany({
      where: { leadId },
      include: MESSAGE_INCLUDE,
      orderBy: { timestamp: 'asc' },
    });
  }

  async markAsRead(leadId: string) {
    return this.prisma.message.updateMany({
      where: { leadId, direction: 'INBOUND', isRead: false },
      data: { isRead: true },
    });
  }

  countUnread(assignedUserId?: string) {
    return this.prisma.message.count({
      where: {
        direction: 'INBOUND',
        isRead: false,
        ...(assignedUserId && {
          lead: { assignedUserId },
        }),
      },
    });
  }

  async getConversations(assignedUserId?: string) {
    const leads = await this.prisma.lead.findMany({
      where: assignedUserId ? { assignedUserId } : undefined,
      select: {
        id: true,
        name: true,
        phone: true,
        assignedUser: { select: { id: true, name: true } },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { body: true, direction: true, timestamp: true, isRead: true },
        },
        _count: {
          select: {
            messages: { where: { direction: 'INBOUND', isRead: false } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return leads
      .filter((l) => l.messages.length > 0)
      .map((l) => ({
        leadId: l.id,
        leadName: l.name,
        phone: l.phone,
        assignedUser: l.assignedUser,
        lastMessage: l.messages[0],
        unreadCount: l._count.messages,
      }));
  }

  async createInbound(data: {
    leadId: string;
    whatsappInstanceId: string;
    body: string;
    mediaUrl?: string;
    mediaType?: string;
  }) {
    return this.prisma.message.create({
      data: { ...data, direction: 'INBOUND' },
      include: MESSAGE_INCLUDE,
    });
  }
}
