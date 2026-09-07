import { ApiProperty } from '@nestjs/swagger';

// Shapes COMPUTADOS pelo CalculoNutricionalService (US-11) — não são
// persistidos. Documentam o contrato de GET .../:id/calculo (nutri e /me).

export class MacrosDto {
  @ApiProperty()
  kcal!: number;

  @ApiProperty()
  proteinaG!: number;

  @ApiProperty()
  lipideosG!: number;

  @ApiProperty()
  carboidratoG!: number;

  @ApiProperty()
  fibraG!: number;
}

export class FonteTacoDto {
  @ApiProperty({ example: 'TACO' })
  tabela!: string;

  @ApiProperty()
  codigo!: number;

  @ApiProperty()
  descricao!: string;
}

export class ItemCalculadoDto {
  @ApiProperty({ required: false })
  descricao?: string;

  @ApiProperty({ required: false })
  alimentoCodigo?: number;

  @ApiProperty({ required: false })
  quantidadeGramas?: number;

  @ApiProperty({ type: () => FonteTacoDto, nullable: true })
  fonte!: FonteTacoDto | null;

  @ApiProperty({ required: false })
  kcal?: number;

  @ApiProperty({ required: false })
  proteinaG?: number;

  @ApiProperty({ required: false })
  lipideosG?: number;

  @ApiProperty({ required: false })
  carboidratoG?: number;

  @ApiProperty({ required: false })
  fibraG?: number;
}

export class RefeicaoCalculadaDto {
  @ApiProperty({ required: false })
  nome?: string;

  @ApiProperty({ required: false })
  horario?: string;

  @ApiProperty({ type: () => [ItemCalculadoDto] })
  itens!: ItemCalculadoDto[];

  @ApiProperty({ type: () => MacrosDto })
  total!: MacrosDto;
}

export class CalculoNutricionalDto {
  @ApiProperty({ type: () => [RefeicaoCalculadaDto] })
  porRefeicao!: RefeicaoCalculadaDto[];

  @ApiProperty({ type: () => MacrosDto })
  total!: MacrosDto;

  // Itens sem alimentoCodigo/quantidadeGramas válidos ou sem match na TACO —
  // listados à parte, fora dos totais.
  @ApiProperty({ type: () => [ItemCalculadoDto] })
  itensSemFonte!: ItemCalculadoDto[];
}
