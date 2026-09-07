import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AlimentosService } from './alimentos.service';
import { AlimentoTacoDto } from './dto/alimento-taco.dto';

// Consulta à Tabela Brasileira de Composição de Alimentos (TACO) — usada
// pelo nutricionista para montar planos com valores nutricionais oficiais.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRICIONISTA')
@Controller('alimentos')
export class AlimentosController {
  constructor(private readonly alimentosService: AlimentosService) {}

  @Get()
  @ApiOkResponse({ type: AlimentoTacoDto, isArray: true })
  buscar(@Query('search') search = ''): Promise<AlimentoTacoDto[]> {
    return this.alimentosService.buscar(search);
  }

  @Get(':codigo')
  @ApiOkResponse({ type: AlimentoTacoDto })
  buscarPorCodigo(@Param('codigo', ParseIntPipe) codigo: number): Promise<AlimentoTacoDto> {
    return this.alimentosService.buscarPorCodigo(codigo);
  }
}
