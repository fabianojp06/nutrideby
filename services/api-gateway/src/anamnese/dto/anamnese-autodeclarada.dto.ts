import { ApiProperty } from '@nestjs/swagger';

// Espelha o model Prisma AnamneseAutodeclarada. Dado auto-declarado pelo
// paciente, SEPARADO do Prontuario oficial. Antropometria é Decimal? no banco
// e o gateway serializa como STRING (ex.: "72.50") — o cliente converte.
export class AnamneseAutodeclaradaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty({ enum: ['PENDENTE_REVISAO', 'INCORPORADA'] })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  respondidoEm!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  incorporadoEm!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  incorporadoPorNutriId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  objetivo!: string | null;

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
  preferenciasAversoes!: string | null;

  @ApiProperty({ type: String, nullable: true })
  rotinaRefeicoes!: string | null;

  @ApiProperty({ type: String, nullable: true })
  consumoAgua!: string | null;

  @ApiProperty({ type: String, nullable: true })
  habitoIntestinal!: string | null;

  @ApiProperty({ type: String, nullable: true })
  sono!: string | null;

  @ApiProperty({ type: String, nullable: true })
  consumoAlcool!: string | null;

  @ApiProperty({ type: String, nullable: true })
  tabagismo!: string | null;

  @ApiProperty({ type: String, nullable: true })
  gestacaoLactacao!: string | null;

  @ApiProperty({ type: String, nullable: true })
  praticaExercicio!: string | null;

  @ApiProperty({ type: String, nullable: true })
  suplementos!: string | null;

  @ApiProperty({ type: String, nullable: true })
  observacoesGerais!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Decimal serializado como string, ex.: "72.50".' })
  pesoDeclaradoKg!: string | null;

  @ApiProperty({ type: String, nullable: true })
  alturaDeclaradaCm!: string | null;
}
