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
import { PlanosAlimentaresService } from './planos-alimentares.service';
import { CalculoNutricionalService } from './calculo-nutricional.service';
import { CreatePlanoAlimentarDto } from './dto/create-plano-alimentar.dto';
import { UpdatePlanoAlimentarDto } from './dto/update-plano-alimentar.dto';
import { DuplicarPlanoAlimentarDto } from './dto/duplicar-plano-alimentar.dto';

// CRUD do nutricionista sobre planos alimentares de um paciente específico.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRICIONISTA')
@Controller('pacientes/:pacienteId/planos-alimentares')
export class PlanosAlimentaresController {
  constructor(
    private readonly planosService: PlanosAlimentaresService,
    private readonly calculoService: CalculoNutricionalService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Body() dto: CreatePlanoAlimentarDto,
  ) {
    return this.planosService.create(user.sub, pacienteId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('pacienteId') pacienteId: string) {
    return this.planosService.findAllByPaciente(pacienteId, user.sub);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.planosService.findOne(pacienteId, id, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanoAlimentarDto,
  ) {
    return this.planosService.update(user.sub, pacienteId, id, dto);
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

  @Post(':id/duplicar')
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
