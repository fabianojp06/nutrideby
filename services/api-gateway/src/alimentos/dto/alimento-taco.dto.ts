import { ApiProperty } from '@nestjs/swagger';

// Alimento da Tabela Brasileira de Composição de Alimentos (TACO), valores por
// 100 g. Espelha o model Prisma AlimentoTaco. Os campos nutricionais são
// Decimal? no banco e são convertidos para `number` na resposta (o cliente faz
// aritmética com eles — ver AlimentosService.toDto). Entra no contrato OpenAPI
// (item 7): admin-web e pwa-patient consomem este tipo.
export class AlimentoTacoDto {
  @ApiProperty()
  codigo!: number;

  @ApiProperty()
  categoria!: string;

  @ApiProperty()
  descricao!: string;

  @ApiProperty({ type: Number, nullable: true })
  umidadePercent!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  kcal!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  kj!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  proteinaG!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  lipideosG!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  colesterolMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  carboidratoG!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  fibraG!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  cinzasG!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  calcioMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  magnesioMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  manganesMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  fosforoMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  ferroMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  sodioMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  potassioMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  cobreMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  zincoMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  retinolMcg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  reMcg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  raeMcg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  tiaminaMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  riboflavinaMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  piridoxinaMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  niacinaMg!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  vitaminaCMg!: number | null;
}
