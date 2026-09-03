import { IsOptional, IsString, Matches } from 'class-validator';

// Aceita CPF (11 dígitos) ou CNPJ (14 dígitos), com ou sem máscara
// (pontos, barra e hífen). Validação de formato apenas — a Asaas faz a
// validação definitiva do documento na criação do cliente.
const CPF_CNPJ_REGEX =
  /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})$/;

export class UpdateNutricionistaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  // Necessário para criar cliente na Asaas ao assinar um plano pago.
  @IsOptional()
  @IsString()
  @Matches(CPF_CNPJ_REGEX, { message: 'cpfCnpj deve ser um CPF ou CNPJ válido.' })
  cpfCnpj?: string;
}
