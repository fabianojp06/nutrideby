import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateRegistroDiarioDto {
  @IsOptional()
  @IsString()
  texto?: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;
}
