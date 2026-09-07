import { Module } from '@nestjs/common';
import { AnamneseController } from './anamnese.controller';
import { MinhaAnamneseController } from './minha-anamnese.controller';
import { AnamneseService } from './anamnese.service';

@Module({
  controllers: [AnamneseController, MinhaAnamneseController],
  providers: [AnamneseService],
})
export class AnamneseModule {}
