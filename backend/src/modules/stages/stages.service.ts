import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@Injectable()
export class StagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStageDto) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id: dto.pipelineId } });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    const conflict = await this.prisma.stage.findFirst({
      where: { pipelineId: dto.pipelineId, position: dto.position },
    });
    if (conflict) throw new BadRequestException(`Posição ${dto.position} já ocupada neste pipeline`);

    return this.prisma.stage.create({ data: dto });
  }

  findByPipeline(pipelineId: string) {
    return this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
    });
  }

  async remove(id: string) {
    const stage = await this.prisma.stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Stage não encontrado');

    const leadCount = await this.prisma.lead.count({ where: { currentStageId: id } });
    if (leadCount > 0) {
      throw new BadRequestException(`Stage contém ${leadCount} lead(s). Mova-os antes de remover.`);
    }

    return this.prisma.stage.delete({ where: { id } });
  }

  async reorder(pipelineId: string, dto: ReorderStagesDto) {
    const stages = await this.prisma.stage.findMany({ where: { pipelineId } });
    const stageIds = new Set(stages.map((s) => s.id));

    for (const id of dto.orderedIds) {
      if (!stageIds.has(id)) throw new BadRequestException(`Stage ${id} não pertence a este pipeline`);
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.stage.update({ where: { id }, data: { position: index } }),
      ),
    );

    return this.findByPipeline(pipelineId);
  }
}
