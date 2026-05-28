import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagSchema, CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@prisma/client';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @UsePipes(new ZodValidationPipe(CreateTagSchema))
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
