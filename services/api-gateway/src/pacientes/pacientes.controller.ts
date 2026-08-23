import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { AceitarConsentimentoDto } from './dto/aceitar-consentimento.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Roles('NUTRICIONISTA')
  @Post('pacientes')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(user.sub, dto);
  }

  @Roles('NUTRICIONISTA')
  @Get('pacientes')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.pacientesService.findAllByNutricionista(user.sub);
  }

  @Roles('NUTRICIONISTA')
  @Get('pacientes/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pacientesService.findOne(user.sub, id);
  }

  @Roles('NUTRICIONISTA')
  @Patch('pacientes/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(user.sub, id, dto);
  }

  @Roles('NUTRICIONISTA')
  @Delete('pacientes/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pacientesService.remove(user.sub, id);
  }

  // Gera o link de convite (deep link) para o paciente vincular sua conta
  // ao bot de notificações do Telegram. O vínculo em si é concluído pelo
  // services/telegram-bot quando o paciente abre o link e envia /start.
  @Roles('NUTRICIONISTA')
  @Post('pacientes/:id/telegram/link')
  gerarLinkTelegram(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pacientesService.gerarLinkTelegram(user.sub, id);
  }

  // Rota do próprio paciente para assinar o Termo de Consentimento.
  // Não passa pelo ConsentGuard (é o que destrava as demais rotas).
  @Roles('PACIENTE')
  @Post('pacientes/me/consentimento')
  aceitarConsentimento(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AceitarConsentimentoDto,
  ) {
    return this.pacientesService.aceitarConsentimento(user.sub, dto);
  }

  // US-05 — direito do paciente de revogar o consentimento a qualquer
  // momento. Também não passa pelo ConsentGuard (revogar não pode depender
  // de já estar consentido — o paciente pode estar tentando corrigir um
  // aceite indevido).
  @Roles('PACIENTE')
  @Post('pacientes/me/consentimento/revogar')
  revogarConsentimento(@CurrentUser() user: AuthenticatedUser) {
    return this.pacientesService.revogarConsentimento(user.sub);
  }
}
