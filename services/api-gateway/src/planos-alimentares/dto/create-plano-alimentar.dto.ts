import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  aprovadoPeloNutri?: boolean;

  // Origem do plano: MANUAL (default) ou IA_RASCUNHO quando salvo a partir de
  // um rascunho do Agente RAG. Dispara o disclaimer CFN na UI.
  @IsOptional()
  @IsIn(['MANUAL', 'IA_RASCUNHO'])
  origem?: 'MANUAL' | 'IA_RASCUNHO';
}
