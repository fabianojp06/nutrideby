import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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
}
