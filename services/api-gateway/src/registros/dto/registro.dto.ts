import { ApiProperty } from '@nestjs/swagger';

// US-14: peso auto-registrado pelo paciente. `pesoKg` é Decimal(5,2) no banco,
// serializado como string ou number pelo gateway — o cliente converte.
export class RegistroPesoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  pesoKg!: string | number;

  @ApiProperty({ type: String, format: 'date-time' })
  registradoEm!: Date;
}

// US-13: diário alimentar do paciente (texto e/ou foto, sem análise por IA).
export class RegistroDiarioDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pacienteId!: string;

  @ApiProperty({ type: String, nullable: true })
  texto!: string | null;

  @ApiProperty({ type: String, nullable: true })
  fotoUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  registradoEm!: Date;
}
