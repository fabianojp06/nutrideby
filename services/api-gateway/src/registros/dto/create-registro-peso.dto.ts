import { IsNumber, Min } from 'class-validator';

export class CreateRegistroPesoDto {
  @IsNumber()
  @Min(1)
  pesoKg!: number;
}
