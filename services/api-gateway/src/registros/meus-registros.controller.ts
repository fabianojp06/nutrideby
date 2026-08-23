import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsentGuard } from '../common/guards/consent.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireConsent } from '../common/decorators/require-consent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RegistrosService } from './registros.service';
import { CreateRegistroPesoDto } from './dto/create-registro-peso.dto';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';

// Rotas do próprio paciente (PWA) — US-13 e US-14. Exigem consentimento
// assinado, como as demais rotas de dado de saúde do paciente.
@UseGuards(JwtAuthGuard, RolesGuard, ConsentGuard)
@Roles('PACIENTE')
@RequireConsent()
@Controller('me')
export class MeusRegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post('peso')
  registrarPeso(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRegistroPesoDto) {
    return this.registrosService.registrarPeso(user.sub, dto);
  }

  @Get('peso')
  listarPeso(@CurrentUser() user: AuthenticatedUser) {
    return this.registrosService.listarPesoDoPaciente(user.sub);
  }

  @Post('diario')
  registrarDiario(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRegistroDiarioDto) {
    return this.registrosService.registrarDiario(user.sub, dto);
  }

  @Get('diario')
  listarDiario(@CurrentUser() user: AuthenticatedUser) {
    return this.registrosService.listarDiarioDoPaciente(user.sub);
  }
}
