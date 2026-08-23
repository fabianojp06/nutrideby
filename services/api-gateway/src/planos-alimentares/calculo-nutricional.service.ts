import { Injectable } from '@nestjs/common';
import { AlimentoTaco, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Formato esperado de cada item dentro de `refeicoes` (JSON livre no
// PlanoAlimentar) para participar do cálculo automático. Itens sem
// `alimentoCodigo` são listados à parte, sem entrar nos totais — o
// nutricionista pode ter itens de anotação livre que não mapeiam a um
// alimento da TACO.
export interface ItemRefeicao {
  descricao?: string;
  alimentoCodigo?: number;
  quantidadeGramas?: number;
}

export interface Refeicao {
  nome?: string;
  horario?: string;
  itens?: ItemRefeicao[];
}

const CAMPOS_MACRO = ['kcal', 'proteinaG', 'lipideosG', 'carboidratoG', 'fibraG'] as const;
type CampoMacro = (typeof CAMPOS_MACRO)[number];
type Totais = Record<CampoMacro, number>;

function totaisZerados(): Totais {
  return { kcal: 0, proteinaG: 0, lipideosG: 0, carboidratoG: 0, fibraG: 0 };
}

function somar(acc: Totais, item: Totais) {
  for (const campo of CAMPOS_MACRO) acc[campo] += item[campo];
}

@Injectable()
export class CalculoNutricionalService {
  constructor(private readonly prisma: PrismaService) {}

  // US-11: cálculo nutricional do plano usando valores oficiais da TACO —
  // cada item traz a fonte (código + descrição TACO), totais somados
  // automaticamente por refeição e no plano inteiro.
  async calcular(refeicoesRaw: Prisma.JsonValue) {
    const refeicoes = (Array.isArray(refeicoesRaw) ? refeicoesRaw : []) as unknown as Refeicao[];

    const codigos = new Set<number>();
    for (const refeicao of refeicoes) {
      for (const item of refeicao.itens ?? []) {
        if (typeof item.alimentoCodigo === 'number') codigos.add(item.alimentoCodigo);
      }
    }

    const alimentos = codigos.size
      ? await this.prisma.alimentoTaco.findMany({ where: { codigo: { in: [...codigos] } } })
      : [];
    const porCodigo = new Map<number, AlimentoTaco>(alimentos.map((a) => [a.codigo, a]));

    const totalPlano = totaisZerados();
    const itensSemFonte: ItemRefeicao[] = [];

    const porRefeicao = refeicoes.map((refeicao) => {
      const totalRefeicao = totaisZerados();
      const itensCalculados = (refeicao.itens ?? []).map((item) => {
        if (typeof item.alimentoCodigo !== 'number' || typeof item.quantidadeGramas !== 'number') {
          itensSemFonte.push(item);
          return { ...item, fonte: null };
        }

        const alimento = porCodigo.get(item.alimentoCodigo);
        if (!alimento) {
          itensSemFonte.push(item);
          return { ...item, fonte: null };
        }

        const fator = item.quantidadeGramas / 100;
        const valores: Totais = {
          kcal: Number(alimento.kcal ?? 0) * fator,
          proteinaG: Number(alimento.proteinaG ?? 0) * fator,
          lipideosG: Number(alimento.lipideosG ?? 0) * fator,
          carboidratoG: Number(alimento.carboidratoG ?? 0) * fator,
          fibraG: Number(alimento.fibraG ?? 0) * fator,
        };

        somar(totalRefeicao, valores);
        somar(totalPlano, valores);

        return {
          ...item,
          fonte: { tabela: 'TACO', codigo: alimento.codigo, descricao: alimento.descricao },
          ...arredondar(valores),
        };
      });

      return {
        nome: refeicao.nome,
        horario: refeicao.horario,
        itens: itensCalculados,
        total: arredondar(totalRefeicao),
      };
    });

    return {
      porRefeicao,
      total: arredondar(totalPlano),
      itensSemFonte,
    };
  }
}

function arredondar(t: Totais) {
  return Object.fromEntries(
    CAMPOS_MACRO.map((campo) => [campo, Math.round(t[campo] * 100) / 100]),
  ) as Totais;
}
