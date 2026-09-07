import { Controller, Get, Param, Patch, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
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

  // Retorna 204 (sem corpo) quando o paciente não tem anamnese auto-declarada —
  // evita o "200 com corpo vazio" que quebra o JSON.parse do admin-web.
  @Get()
  @ApiOkResponse({ type: AnamneseAutodeclaradaDto })
  @ApiNoContentResponse({ description: 'Paciente não tem anamnese auto-declarada.' })
  async buscarMaisRecente(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const anamnese = await this.anamneseService.buscarMaisRecenteParaNutricionista(
      user.sub,
      pacienteId,
    );
    if (!anamnese) {
      res.status(204);
      return undefined;
    }
    return anamnese;
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
