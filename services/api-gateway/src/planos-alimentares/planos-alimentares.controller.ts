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
import { AssinaturaAtivaGuard } from '../common/guards/assinatura-ativa.guard';
import { RequireAssinaturaAtiva } from '../common/decorators/require-assinatura-ativa.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PlanosAlimentaresService } from './planos-alimentares.service';
import { CalculoNutricionalService } from './calculo-nutricional.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { PlanoAlimentarDto } from './dto/plano-alimentar.dto';
import { CreatePlanoAlimentarDto } from './dto/create-plano-alimentar.dto';
import { UpdatePlanoAlimentarDto } from './dto/update-plano-alimentar.dto';
import { DuplicarPlanoAlimentarDto } from './dto/duplicar-plano-alimentar.dto';
import { GerarRascunhoIaDto } from './dto/gerar-rascunho-ia.dto';

// CRUD do nutricionista sobre planos alimentares de um paciente específico.
@UseGuards(JwtAuthGuard, RolesGuard, AssinaturaAtivaGuard)
@Roles('NUTRICIONISTA')
@RequireAssinaturaAtiva()
@Controller('pacientes/:pacienteId/planos-alimentares')
export class PlanosAlimentaresController {
  constructor(
    private readonly planosService: PlanosAlimentaresService,
    private readonly calculoService: CalculoNutricionalService,
  ) {}

  @Post()
  @ApiOkResponse({ type: PlanoAlimentarDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Body() dto: CreatePlanoAlimentarDto,
  ) {
    return this.planosService.create(user.sub, pacienteId, dto);
  }

  @Get()
  @ApiOkResponse({ type: PlanoAlimentarDto, isArray: true })
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('pacienteId') pacienteId: string) {
    return this.planosService.findAllByPaciente(pacienteId, user.sub);
  }

  @Get(':id')
  @ApiOkResponse({ type: PlanoAlimentarDto })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.planosService.findOne(pacienteId, id, user.sub);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PlanoAlimentarDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanoAlimentarDto,
  ) {
    return this.planosService.update(user.sub, pacienteId, id, dto);
  }

  @Post(':id/aprovar')
  @ApiOkResponse({ type: PlanoAlimentarDto })
  aprovar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.planosService.aprovar(user.sub, pacienteId, id);
  }

  @Get(':id/calculo')
  async calcular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    const plano = await this.planosService.findOne(pacienteId, id, user.sub);
    return this.calculoService.calcular(plano.refeicoes);
  }

  @Post('rascunho-ia')
  gerarRascunhoIA(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Body() dto: GerarRascunhoIaDto,
  ) {
    return this.planosService.gerarRascunhoIA(user.sub, pacienteId, dto.perguntaNutricionista);
  }

  @Post(':id/duplicar')
  @ApiOkResponse({ type: PlanoAlimentarDto })
  duplicar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
    @Body() dto: DuplicarPlanoAlimentarDto,
  ) {
    return this.planosService.duplicar(user.sub, pacienteId, id, dto.pacienteDestinoId);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.planosService.remove(user.sub, pacienteId, id);
  }
}
