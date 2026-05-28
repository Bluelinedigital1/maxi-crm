import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '@prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080';
  private readonly apiKey = process.env.EVOLUTION_API_KEY ?? '';

  constructor(private prisma: PrismaService) {}

  private get headers() {
    return { apikey: this.apiKey, 'Content-Type': 'application/json' };
  }

  async createInstance(dto: CreateInstanceDto, userId: string) {
    const existing = await this.prisma.whatsappInstance.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existing) throw new BadRequestException('Número já registrado');

    const instance = await this.prisma.whatsappInstance.create({
      data: { name: dto.name, phoneNumber: dto.phoneNumber, userId, status: 'DISCONNECTED' },
    });

    try {
      await axios.post(
        `${this.apiUrl}/instance/create`,
        { instanceName: instance.id, qrcode: true },
        { headers: this.headers },
      );
    } catch (err) {
      this.logger.error(`Erro ao criar instância na Evolution API: ${err}`);
    }

    return instance;
  }

  async getQrCode(instanceId: string) {
    const instance = await this.findOne(instanceId);

    const { data } = await axios.get(
      `${this.apiUrl}/instance/connect/${instance.id}`,
      { headers: this.headers },
    );

    const qrCodeBase64 = data?.base64 ?? null;

    await this.prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { qrCodeBase64, status: 'CONNECTING' },
    });

    return { qrCodeBase64 };
  }

  async handleConnectionUpdate(instanceId: string, status: 'CONNECTED' | 'DISCONNECTED') {
    await this.prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: {
        status,
        ...(status === 'CONNECTED' && { qrCodeBase64: null }),
      },
    });
  }

  async sendMessage(instanceId: string, dto: SendMessageDto) {
    const instance = await this.findOne(instanceId);

    if (instance.status !== 'CONNECTED') {
      throw new BadRequestException('Instância não está conectada');
    }

    const phone = dto.to.replace(/\D/g, '');

    const { data } = await axios.post(
      `${this.apiUrl}/message/sendText/${instance.id}`,
      { number: phone, textMessage: { text: dto.body } },
      { headers: this.headers },
    );

    return this.prisma.message.create({
      data: {
        leadId: dto.leadId,
        whatsappInstanceId: instanceId,
        direction: 'OUTBOUND',
        body: dto.body,
      },
    });
  }

  findAll(userId?: string) {
    return this.prisma.whatsappInstance.findMany({
      where: userId ? { userId } : undefined,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const instance = await this.prisma.whatsappInstance.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    return instance;
  }

  async disconnect(instanceId: string) {
    const instance = await this.findOne(instanceId);

    try {
      await axios.delete(
        `${this.apiUrl}/instance/logout/${instance.id}`,
        { headers: this.headers },
      );
    } catch (err) {
      this.logger.warn(`Erro ao desconectar da Evolution API: ${err}`);
    }

    return this.prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { status: 'DISCONNECTED', qrCodeBase64: null },
    });
  }

  async remove(instanceId: string) {
    const instance = await this.findOne(instanceId);

    try {
      await axios.delete(
        `${this.apiUrl}/instance/delete/${instance.id}`,
        { headers: this.headers },
      );
    } catch (err) {
      this.logger.warn(`Erro ao remover da Evolution API: ${err}`);
    }

    return this.prisma.whatsappInstance.delete({ where: { id: instanceId } });
  }
}
