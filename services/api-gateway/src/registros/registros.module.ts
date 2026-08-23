import { Module } from '@nestjs/common';
import { RegistrosController } from './registros.controller';
import { MeusRegistrosController } from './meus-registros.controller';
import { RegistrosService } from './registros.service';

@Module({
  controllers: [RegistrosController, MeusRegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
