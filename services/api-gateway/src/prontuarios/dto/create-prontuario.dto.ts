import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProntuarioDto {
  @IsOptional()
  @IsString()
  queixaPrincipal?: string;

  @IsOptional()
  @IsString()
  historicoClinico?: string;

  @IsOptional()
  @IsString()
  historicoFamiliar?: string;

  @IsOptional()
  @IsString()
  habitosAlimentares?: string;

  @IsOptional()
  @IsString()
  usoMedicamentos?: string;

  @IsOptional()
  @IsString()
  alergias?: string;

  @IsOptional()
  @IsString()
  intolerancias?: string;

  @IsOptional()
  @IsString()
  nivelAtividadeFisica?: string;

  @IsOptional()
  @IsString()
  observacoesGerais?: string;

  @IsOptional()
  @IsNumber()
  pesoKg?: number;

  @IsOptional()
  @IsNumber()
  alturaCm?: number;

  @IsOptional()
  @IsNumber()
  circunferenciaCintura?: number;

  @IsOptional()
  @IsNumber()
  circunferenciaQuadril?: number;

  @IsOptional()
  @IsNumber()
  percentualGordura?: number;

  @IsOptional()
  @IsNumber()
  imc?: number;
}
