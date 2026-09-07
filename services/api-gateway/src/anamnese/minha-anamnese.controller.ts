import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsentGuard } from '../common/guards/consent.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireConsent } from '../common/decorators/require-consent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AnamneseService } from './anamnese.service';
import { CreateAnamneseAutodeclaradaDto } from './dto/create-anamnese-autodeclarada.dto';
import { AnamneseAutodeclaradaDto } from './dto/anamnese-autodeclarada.dto';

// Item 20 — anamnese de pré-consulta auto-declarada pelo próprio paciente (PWA).
// Exige consentimento assinado, como as demais rotas de dado de saúde do
// paciente. É dado auto-declarado, separado do Prontuario oficial.
@UseGuards(JwtAuthGuard, RolesGuard, ConsentGuard)
@Roles('PACIENTE')
@RequireConsent()
@Controller('me/anamnese')
export class MinhaAnamneseController {
  constructor(private readonly anamneseService: AnamneseService) {}

  @Post()
  @ApiOkResponse({ type: AnamneseAutodeclaradaDto })
  enviar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnamneseAutodeclaradaDto,
  ) {
    return this.anamneseService.enviar(user.sub, dto);
  }

  // Retorna 204 (sem corpo) quando o paciente nunca respondeu — evita o
  // "200 com corpo vazio" que quebra o JSON.parse dos clients (PWA/admin).
  @Get()
  @ApiOkResponse({ type: AnamneseAutodeclaradaDto })
  @ApiNoContentResponse({ description: 'Paciente ainda não respondeu a anamnese.' })
  async minhaAnamnese(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const anamnese = await this.anamneseService.buscarMaisRecenteDoPaciente(user.sub);
    if (!anamnese) {
      res.status(204);
      return undefined;
    }
    return anamnese;
  }
}
