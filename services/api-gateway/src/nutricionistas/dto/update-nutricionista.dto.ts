import { IsOptional, IsString } from 'class-validator';

export class UpdateNutricionistaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
