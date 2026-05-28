import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: User) {
    const userId = user.role === Role.SELLER ? user.id : undefined;
    return this.messagesService.getConversations(userId);
  }

  @Get('lead/:leadId')
  findByLead(@Param('leadId') leadId: string) {
    return this.messagesService.findByLead(leadId);
  }

  @Patch('lead/:leadId/read')
  markAsRead(@Param('leadId') leadId: string) {
    return this.messagesService.markAsRead(leadId);
  }

  @Get('unread/count')
  countUnread(@CurrentUser() user: User) {
    const userId = user.role === Role.SELLER ? user.id : undefined;
    return this.messagesService.countUnread(userId);
  }
}
