import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from '@prisma/client';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  roundRobinIndex: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash, role: dto.role },
      select: USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  findActiveSellers() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['SELLER', 'MANAGER'] } },
      select: USER_SELECT,
      orderBy: { roundRobinIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: Role) {
    await this.findOne(id);

    if (requesterId !== id && requesterRole === 'SELLER') {
      throw new ForbiddenException('Sem permissão para editar outros usuários');
    }

    const data: Record<string, unknown> = {};

    if (dto.name) data.name = dto.name;
    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('E-mail já cadastrado');
      data.email = dto.email;
    }
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);
    if (dto.role !== undefined && requesterRole === 'ADMIN') data.role = dto.role;
    if (dto.isActive !== undefined && requesterRole === 'ADMIN') data.isActive = dto.isActive;

    return this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  async getNextRoundRobin(): Promise<string> {
    const sellers = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['SELLER', 'MANAGER'] } },
      orderBy: { roundRobinIndex: 'asc' },
      select: { id: true, roundRobinIndex: true },
    });

    if (!sellers.length) throw new Error('Nenhum vendedor ativo disponível para atribuição');

    const next = sellers[0];
    const maxIndex = sellers[sellers.length - 1].roundRobinIndex;

    await this.prisma.user.update({
      where: { id: next.id },
      data: { roundRobinIndex: maxIndex + 1 },
    });

    return next.id;
  }
}
