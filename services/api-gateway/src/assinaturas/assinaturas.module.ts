import { Module } from '@nestjs/common';
import { AssinaturasController } from './assinaturas.controller';
import { AssinaturasService } from './assinaturas.service';
import { AsaasService } from './asaas.service';

@Module({
  controllers: [AssinaturasController],
  providers: [AssinaturasService, AsaasService],
})
export class AssinaturasModule {}
