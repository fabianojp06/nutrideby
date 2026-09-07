import { Injectable, NotFoundException } from '@nestjs/common';
import { AlimentoTaco } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlimentoTacoDto } from './dto/alimento-taco.dto';

const LIMITE_BUSCA_PADRAO = 20;

@Injectable()
export class AlimentosService {
  constructor(private readonly prisma: PrismaService) {}

  // Busca usada pelo nutricionista ao montar um plano alimentar — nome
  // parcial, case-insensitive (ex.: "arroz" encontra "Arroz, integral, cru").
  async buscar(termo: string, limite = LIMITE_BUSCA_PADRAO): Promise<AlimentoTacoDto[]> {
    const alimentos = await this.prisma.alimentoTaco.findMany({
      where: { descricao: { contains: termo, mode: 'insensitive' } },
      orderBy: { descricao: 'asc' },
      take: Math.min(limite, 100),
    });
    return alimentos.map((a) => this.toDto(a));
  }

  async buscarPorCodigo(codigo: number): Promise<AlimentoTacoDto> {
    const alimento = await this.prisma.alimentoTaco.findUnique({ where: { codigo } });
    if (!alimento) throw new NotFoundException('Alimento não encontrado na tabela TACO.');
    return this.toDto(alimento);
  }

  // Prisma devolve Decimal? nos campos nutricionais; o cliente faz aritmética
  // com eles, então a resposta expõe `number`. codigo/categoria/descricao não
  // são Decimal e passam direto.
  private toDto(row: AlimentoTaco): AlimentoTacoDto {
    const { codigo, categoria, descricao, ...nutrientes } = row;
    const convertidos = Object.fromEntries(
      Object.entries(nutrientes).map(([k, v]) => [k, v == null ? null : Number(v)]),
    );
    return { codigo, categoria, descricao, ...convertidos } as AlimentoTacoDto;
  }
}
