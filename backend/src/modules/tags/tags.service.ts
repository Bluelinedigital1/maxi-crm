import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    const exists = await this.prisma.tag.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Tag já existe');
    return this.prisma.tag.create({ data: dto });
  }

  findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    return this.prisma.tag.delete({ where: { id } });
  }
}
