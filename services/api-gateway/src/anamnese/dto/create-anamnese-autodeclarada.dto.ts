import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Item 20 — payload enviado pelo próprio paciente (PWA) antes da consulta.
// Todos os campos são opcionais: o paciente responde o que souber/quiser.
export class CreateAnamneseAutodeclaradaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objetivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  queixaPrincipal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  historicoClinico?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  historicoFamiliar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  habitosAlimentares?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  usoMedicamentos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alergias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  intolerancias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nivelAtividadeFisica?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferenciasAversoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rotinaRefeicoes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consumoAgua?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  habitoIntestinal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consumoAlcool?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tabagismo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gestacaoLactacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  praticaExercicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suplementos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoesGerais?: string;

  @ApiPropertyOptional({ description: 'Peso auto-declarado (kg). Provisório, não oficial.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoDeclaradoKg?: number;

  @ApiPropertyOptional({ description: 'Altura auto-declarada (cm). Provisória, não oficial.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  alturaDeclaradaCm?: number;
}
