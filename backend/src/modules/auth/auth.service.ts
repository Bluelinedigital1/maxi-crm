import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair & { user: object }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refresh(token: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { token } });
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    await this.prisma.refreshToken.delete({ where: { token } });

    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async createUser(payload: CreateUserPayload) {
    const exists = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(payload.password, 12);

    return this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role ?? 'SELLER',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload = { sub: userId, email, role };

    const [accessToken, rawRefresh] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: rawRefresh, userId, expiresAt },
    });

    return { accessToken, refreshToken: rawRefresh };
  }
}
