import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AlimentosService } from './alimentos.service';

// Consulta à Tabela Brasileira de Composição de Alimentos (TACO) — usada
// pelo nutricionista para montar planos com valores nutricionais oficiais.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRICIONISTA')
@Controller('alimentos')
export class AlimentosController {
  constructor(private readonly alimentosService: AlimentosService) {}

  @Get()
  buscar(@Query('search') search = '') {
    return this.alimentosService.buscar(search);
  }

  @Get(':codigo')
  buscarPorCodigo(@Param('codigo', ParseIntPipe) codigo: number) {
    return this.alimentosService.buscarPorCodigo(codigo);
  }
}
