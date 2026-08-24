import { Module } from '@nestjs/common';
import { PlanosAlimentaresController } from './planos-alimentares.controller';
import { MeusPlanosAlimentaresController } from './meus-planos-alimentares.controller';
import { PlanosAlimentaresService } from './planos-alimentares.service';
import { CalculoNutricionalService } from './calculo-nutricional.service';
import { RagAgentService } from './rag-agent.service';

@Module({
  controllers: [PlanosAlimentaresController, MeusPlanosAlimentaresController],
  providers: [PlanosAlimentaresService, CalculoNutricionalService, RagAgentService],
})
export class PlanosAlimentaresModule {}
