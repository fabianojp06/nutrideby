import { ApiProperty } from '@nestjs/swagger';

// Output do Agente Clínico RAG (US-08). COMPLIANCE: é referência para a nutri,
// NÃO é um plano, NÃO persiste e NÃO chega ao paciente. `disclaimer` (Código de
// Ética CFN) vem sempre preenchido e é exibido com destaque na UI.
export class FonteRagDto {
  @ApiProperty()
  source!: string;

  @ApiProperty()
  trecho!: string;

  @ApiProperty()
  similaridade!: number;
}

export class RascunhoIaDto {
  @ApiProperty()
  rascunho!: string;

  @ApiProperty({ type: () => [FonteRagDto] })
  fontesUtilizadas!: FonteRagDto[];

  @ApiProperty()
  modeloUtilizado!: string;

  @ApiProperty({ description: 'Disclaimer CFN — "sugestão para revisão do profissional".' })
  disclaimer!: string;
}
