import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, UseGuards, UsePipes,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { CreateInstanceSchema, CreateInstanceDto } from './dto/create-instance.dto';
import { SendMessageSchema, SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role, User } from '@prisma/client';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('instances')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(CreateInstanceSchema))
  createInstance(@Body() dto: CreateInstanceDto, @CurrentUser() user: User) {
    return this.whatsappService.createInstance(dto, user.id);
  }

  @Get('instances')
  findAll(@CurrentUser() user: User) {
    const userId = user.role === Role.SELLER ? user.id : undefined;
    return this.whatsappService.findAll(userId);
  }

  @Get('instances/:id')
  findOne(@Param('id') id: string) {
    return this.whatsappService.findOne(id);
  }

  @Get('instances/:id/qr')
  @Roles(Role.ADMIN)
  getQrCode(@Param('id') id: string) {
    return this.whatsappService.getQrCode(id);
  }

  @Post('instances/:id/send')
  sendMessage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.whatsappService.sendMessage(id, dto);
  }

  @Patch('instances/:id/disconnect')
  @Roles(Role.ADMIN)
  disconnect(@Param('id') id: string) {
    return this.whatsappService.disconnect(id);
  }

  @Delete('instances/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.whatsappService.remove(id);
  }
}
