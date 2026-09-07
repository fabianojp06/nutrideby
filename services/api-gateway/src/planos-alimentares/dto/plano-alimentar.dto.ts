import { ApiProperty } from '@nestjs/swagger';
import { OrigemPlano } from '@prisma/client';

// Espelha o model Prisma PlanoAlimentar. Resposta das rotas de plano do
// nutricionista E das rotas /me/* do paciente. Nas rotas /me/* só chegam
// planos com aprovadoPeloNutri=true (filtro em PlanosAlimentaresService,
// travado por testes) — o campo continua no shape, mas nunca com valor false
// numa resposta ao paciente. Este DTO só documenta o contrato; não altera
// nenhuma query nem serialização.
export class PlanoAlimentarDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty()
  titulo!: string;

  @ApiProperty({ type: String, nullable: true })
  objetivo!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  caloriasAlvo!: number | null;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'JSON livre: [{ nome, horario, itens: [{ descricao?, alimentoCodigo?, quantidadeGramas? }] }].',
  })
  refeicoes!: Record<string, unknown>[];

  @ApiProperty({ type: String, nullable: true })
  observacoes!: string | null;

  @ApiProperty({ enum: OrigemPlano })
  origem!: OrigemPlano;

  @ApiProperty({ description: 'Gate de compliance. Nas rotas /me/* nunca vem false.' })
  aprovadoPeloNutri!: boolean;

  @ApiProperty()
  ativo!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: Date;
}

// Item da fila global de aprovação (GET /planos-alimentares/pendentes) —
// shape mapeado em PlanosAlimentaresService.findPendentesAprovacao.
export class PlanoPendenteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty()
  pacienteNome!: string;

  @ApiProperty()
  titulo!: string;

  @ApiProperty({ enum: OrigemPlano })
  origem!: OrigemPlano;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;
}
