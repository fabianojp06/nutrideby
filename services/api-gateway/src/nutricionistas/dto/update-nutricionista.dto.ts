import { IsOptional, IsString } from 'class-validator';

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
  cpfCnpj?: string;
}
