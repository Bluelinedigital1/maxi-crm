import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePipelineDto) {
    return this.prisma.pipeline.create({
      data: dto,
      include: { stages: { orderBy: { position: 'asc' } } },
    });
  }

  findAll() {
    return this.prisma.pipeline.findMany({
      include: { stages: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    return pipeline;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.pipeline.delete({ where: { id } });
  }
}
