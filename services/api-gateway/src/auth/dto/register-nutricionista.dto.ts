import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

// CRN (Conselho Regional de Nutricionistas): "CRN-<região> <número>".
// Regiões 1–11; número de 3 a 6 dígitos; categoria opcional (ex.: /P).
// Separadores flexíveis (espaço/hífen) e case-insensitive para não rejeitar
// variações válidas de digitação, mas exige a estrutura CRN + região + número.
const CRN_REGEX = /^CRN[-\s]?(1[01]|[1-9])[-\s]?\d{3,6}(\/[A-Za-z])?$/i;

export class RegisterNutricionistaDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsString()
  @Matches(CRN_REGEX, {
    message:
      'CRN inválido. Use o formato CRN-<região> <número>, por exemplo: CRN-3 12345.',
  })
  crn!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  // Plano escolhido no cadastro — inicia um TRIAL de 14 dias sem cartão.
  // Opcional: default STARTER quando não informado.
  @IsOptional()
  @IsIn(['STARTER', 'PRO', 'CLINICA'])
  plano?: 'STARTER' | 'PRO' | 'CLINICA';
}
