import { ApiProperty } from '@nestjs/swagger';
import { PlanoAssinatura, StatusAssinatura } from '@prisma/client';

// Espelha o model Prisma Assinatura. Resposta de POST /assinaturas,
// /assinaturas/converter-para-pago, /assinaturas/trial e GET /assinaturas/me.
// Entra no contrato OpenAPI (item 7).
export class AssinaturaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nutricionistaId!: string;

  @ApiProperty({ enum: PlanoAssinatura })
  plano!: PlanoAssinatura;

  @ApiProperty({ enum: StatusAssinatura })
  status!: StatusAssinatura;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  trialAte!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  inadimplenteDesde!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  asaasCustomerId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  asaasSubscriptionId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: Date;
}
