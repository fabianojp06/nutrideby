import { Module } from '@nestjs/common';
import { ProntuariosController } from './prontuarios.controller';
import { ProntuariosService } from './prontuarios.service';

@Module({
  controllers: [ProntuariosController],
  providers: [ProntuariosService],
})
export class ProntuariosModule {}
