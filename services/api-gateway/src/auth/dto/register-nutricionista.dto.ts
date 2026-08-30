import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterNutricionistaDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsString()
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
