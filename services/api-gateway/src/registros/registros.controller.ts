import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssinaturaAtivaGuard } from '../common/guards/assinatura-ativa.guard';
import { RequireAssinaturaAtiva } from '../common/decorators/require-assinatura-ativa.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RegistrosService } from './registros.service';

// Visualização do nutricionista sobre os registros do próprio paciente
// (US-07: gráfico de evolução; US-13: "nutricionista visualiza o diário
// no Admin Web").
@UseGuards(JwtAuthGuard, RolesGuard, AssinaturaAtivaGuard)
@Roles('NUTRICIONISTA')
@RequireAssinaturaAtiva()
@Controller('pacientes/:pacienteId')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Get('peso')
  listarPeso(@CurrentUser() user: AuthenticatedUser, @Param('pacienteId') pacienteId: string) {
    return this.registrosService.listarPesoParaNutricionista(user.sub, pacienteId);
  }

  @Get('diario')
  listarDiario(@CurrentUser() user: AuthenticatedUser, @Param('pacienteId') pacienteId: string) {
    return this.registrosService.listarDiarioParaNutricionista(user.sub, pacienteId);
  }
}
