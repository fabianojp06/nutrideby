import { Module } from '@nestjs/common';
import { PlanosAlimentaresController } from './planos-alimentares.controller';
import { MeusPlanosAlimentaresController } from './meus-planos-alimentares.controller';
import { PlanosAlimentaresService } from './planos-alimentares.service';

@Module({
  controllers: [PlanosAlimentaresController, MeusPlanosAlimentaresController],
  providers: [PlanosAlimentaresService],
})
export class PlanosAlimentaresModule {}
