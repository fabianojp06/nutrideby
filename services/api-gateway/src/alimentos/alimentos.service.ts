import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LIMITE_BUSCA_PADRAO = 20;

@Injectable()
export class AlimentosService {
  constructor(private readonly prisma: PrismaService) {}

  // Busca usada pelo nutricionista ao montar um plano alimentar — nome
  // parcial, case-insensitive (ex.: "arroz" encontra "Arroz, integral, cru").
  buscar(termo: string, limite = LIMITE_BUSCA_PADRAO) {
    return this.prisma.alimentoTaco.findMany({
      where: { descricao: { contains: termo, mode: 'insensitive' } },
      orderBy: { descricao: 'asc' },
      take: Math.min(limite, 100),
    });
  }

  async buscarPorCodigo(codigo: number) {
    const alimento = await this.prisma.alimentoTaco.findUnique({ where: { codigo } });
    if (!alimento) throw new NotFoundException('Alimento não encontrado na tabela TACO.');
    return alimento;
  }
}
