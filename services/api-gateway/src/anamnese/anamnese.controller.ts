import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssinaturaAtivaGuard } from '../common/guards/assinatura-ativa.guard';
import { RequireAssinaturaAtiva } from '../common/decorators/require-assinatura-ativa.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AnamneseService } from './anamnese.service';
import { AnamneseAutodeclaradaDto } from './dto/anamnese-autodeclarada.dto';

// Item 20 — visão da nutri sobre a anamnese auto-declarada do paciente.
// A nutri revisa e incorpora (assina); a criação do Prontuario oficial
// continua sendo pelo endpoint POST /pacientes/:id/prontuarios.
// AssinaturaAtivaGuard para paridade com prontuarios/planos: nutri
// inadimplente não acessa dado de saúde do paciente.
@UseGuards(JwtAuthGuard, RolesGuard, AssinaturaAtivaGuard)
@Roles('NUTRICIONISTA')
@RequireAssinaturaAtiva()
@Controller('pacientes/:pacienteId/anamnese')
export class AnamneseController {
  constructor(private readonly anamneseService: AnamneseService) {}

  @Get()
  @ApiOkResponse({ type: AnamneseAutodeclaradaDto })
  buscarMaisRecente(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
  ) {
    return this.anamneseService.buscarMaisRecenteParaNutricionista(user.sub, pacienteId);
  }

  @Patch(':id/incorporar')
  @ApiOkResponse({ type: AnamneseAutodeclaradaDto })
  incorporar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.anamneseService.incorporar(user.sub, pacienteId, id);
  }
}
