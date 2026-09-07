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
import { ApiOkResponse } from '@nestjs/swagger';
import { ProntuariosService } from './prontuarios.service';
import { ProntuarioDto } from './dto/prontuario.dto';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

// Rotas exclusivas do nutricionista: quem trata o dado de saúde do
// paciente é o profissional, mediante consentimento já registrado
// (validado na criação do paciente/aceite do termo).
@UseGuards(JwtAuthGuard, RolesGuard, AssinaturaAtivaGuard)
@Roles('NUTRICIONISTA')
@RequireAssinaturaAtiva()
@Controller('pacientes/:pacienteId/prontuarios')
export class ProntuariosController {
  constructor(private readonly prontuariosService: ProntuariosService) {}

  @Post()
  @ApiOkResponse({ type: ProntuarioDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Body() dto: CreateProntuarioDto,
  ) {
    return this.prontuariosService.create(user.sub, pacienteId, dto);
  }

  @Get()
  @ApiOkResponse({ type: ProntuarioDto, isArray: true })
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('pacienteId') pacienteId: string) {
    return this.prontuariosService.findAllByPaciente(user.sub, pacienteId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProntuarioDto })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.prontuariosService.findOne(user.sub, pacienteId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProntuarioDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProntuarioDto,
  ) {
    return this.prontuariosService.update(user.sub, pacienteId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pacienteId') pacienteId: string,
    @Param('id') id: string,
  ) {
    return this.prontuariosService.remove(user.sub, pacienteId, id);
  }
}
