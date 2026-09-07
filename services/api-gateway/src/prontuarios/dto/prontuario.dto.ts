import { ApiProperty } from '@nestjs/swagger';

// Espelha o model Prisma Prontuario — anamnese + antropometria, dado de saúde
// sensível. Rotas exclusivas do nutricionista (não há rota /me de prontuário).
// Campos antropométricos são Decimal? no banco e o gateway os serializa como
// STRING (ex.: "90.00") — o DTO documenta esse contrato; o cliente converte.
// Só documentação de contrato: nenhuma query/serialização muda.
export class ProntuarioDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty({ type: String, nullable: true })
  queixaPrincipal!: string | null;

  @ApiProperty({ type: String, nullable: true })
  historicoClinico!: string | null;

  @ApiProperty({ type: String, nullable: true })
  historicoFamiliar!: string | null;

  @ApiProperty({ type: String, nullable: true })
  habitosAlimentares!: string | null;

  @ApiProperty({ type: String, nullable: true })
  usoMedicamentos!: string | null;

  @ApiProperty({ type: String, nullable: true })
  alergias!: string | null;

  @ApiProperty({ type: String, nullable: true })
  intolerancias!: string | null;

  @ApiProperty({ type: String, nullable: true })
  nivelAtividadeFisica!: string | null;

  @ApiProperty({ type: String, nullable: true })
  observacoesGerais!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Decimal serializado como string, ex.: "90.00".' })
  pesoKg!: string | null;

  @ApiProperty({ type: String, nullable: true })
  alturaCm!: string | null;

  @ApiProperty({ type: String, nullable: true })
  circunferenciaCintura!: string | null;

  @ApiProperty({ type: String, nullable: true })
  circunferenciaQuadril!: string | null;

  @ApiProperty({ type: String, nullable: true })
  percentualGordura!: string | null;

  @ApiProperty({ type: String, nullable: true })
  imc!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: Date;
}
