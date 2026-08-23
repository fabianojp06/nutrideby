import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsIn(['MASCULINO', 'FEMININO'])
  sexoBiologico?: 'MASCULINO' | 'FEMININO';
}
