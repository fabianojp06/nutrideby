import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssinaturaAtivaGuard } from '../common/guards/assinatura-ativa.guard';
import { RequireAssinaturaAtiva } from '../common/decorators/require-assinatura-ativa.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PlanosAlimentaresService } from './planos-alimentares.service';

// GAP#1 — Fila de aprovação. Visão GLOBAL (sem :pacienteId) dos planos
// pendentes de aprovação de todos os pacientes do nutricionista logado.
@UseGuards(JwtAuthGuard, RolesGuard, AssinaturaAtivaGuard)
@Roles('NUTRICIONISTA')
@RequireAssinaturaAtiva()
@Controller('planos-alimentares')
export class FilaAprovacaoController {
  constructor(private readonly planosService: PlanosAlimentaresService) {}

  @Get('pendentes')
  pendentes(@CurrentUser() user: AuthenticatedUser) {
    return this.planosService.findPendentesAprovacao(user.sub);
  }
}
