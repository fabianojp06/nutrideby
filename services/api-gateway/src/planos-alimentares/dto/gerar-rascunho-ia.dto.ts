import { IsString, MaxLength, MinLength } from 'class-validator';

export class GerarRascunhoIaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  perguntaNutricionista!: string;
}
