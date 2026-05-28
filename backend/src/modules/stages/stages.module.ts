import { Module } from '@nestjs/common';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';

@Module({
  providers: [StagesService],
  controllers: [StagesController],
  exports: [StagesService],
})
export class StagesModule {}
