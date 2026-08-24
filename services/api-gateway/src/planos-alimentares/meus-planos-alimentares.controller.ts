import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsentGuard } from '../common/guards/consent.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireConsent } from '../common/decorators/require-consent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PlanosAlimentaresService } from './planos-alimentares.service';
import { CalculoNutricionalService } from './calculo-nutricional.service';

// Rotas do próprio paciente (PWA). Exigem Termo de Consentimento assinado
// — ConsentGuard bloqueia com 403 enquanto statusConsentimento != ACEITO.
@UseGuards(JwtAuthGuard, RolesGuard, ConsentGuard)
@Roles('PACIENTE')
@RequireConsent()
@Controller('me/planos-alimentares')
export class MeusPlanosAlimentaresController {
  constructor(
    private readonly planosService: PlanosAlimentaresService,
    private readonly calculoService: CalculoNutricionalService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.planosService.findAllByPaciente(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.planosService.findOne(user.sub, id);
  }

  // Espelha GET /pacientes/:id/planos-alimentares/:id/calculo (visão do
  // nutricionista), mas sob a ótica do próprio paciente — usado pelo
  // dashboard da PWA (meta calórica/macros do dia).
  @Get(':id/calculo')
  async calcular(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const plano = await this.planosService.findOne(user.sub, id);
    return this.calculoService.calcular(plano.refeicoes);
  }
}
