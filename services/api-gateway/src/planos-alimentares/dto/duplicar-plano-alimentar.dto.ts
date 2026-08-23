import { IsString } from 'class-validator';

export class DuplicarPlanoAlimentarDto {
  @IsString()
  pacienteDestinoId!: string;
}
