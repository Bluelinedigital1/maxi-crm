import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema, LoginDto } from './dto/login.dto';
import { RefreshTokenSchema, RefreshTokenDto } from './dto/refresh-token.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(RefreshTokenSchema))
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(RefreshTokenSchema))
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
