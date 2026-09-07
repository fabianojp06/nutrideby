import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePlanoAlimentarDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @IsInt()
  caloriasAlvo?: number;

  // Estrutura livre nesta fase: [{ nome, horario, itens: [...] }].
  // A geração assistida por IA (rag-agent) preenche este campo em fase
  // futura — aqui é apenas CRUD manual do nutricionista.
  @IsArray()
  refeicoes!: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  observacoes?: string;

  // Origem do plano: MANUAL (default) ou IA_RASCUNHO quando salvo a partir de
  // um rascunho do Agente RAG. Dispara o disclaimer CFN na UI. Imutável após a
  // criação (não está no UpdatePlanoAlimentarDto) — um plano de IA não pode ser
  // "lavado" para MANUAL e escapar do disclaimer.
  @IsOptional()
  @IsIn(['MANUAL', 'IA_RASCUNHO'])
  origem?: 'MANUAL' | 'IA_RASCUNHO';
}
