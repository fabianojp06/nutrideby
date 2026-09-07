import { ApiProperty } from '@nestjs/swagger';

// US-18: uma fatura no histórico de cobrança. Deriva da fatura da Asaas
// (AssinaturasService.listarFaturas). Resposta de GET /assinaturas/me/faturas.
export class FaturaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  valor!: number;

  @ApiProperty({ enum: ['paga', 'pendente', 'falhou', 'outro'] })
  status!: 'paga' | 'pendente' | 'falhou' | 'outro';

  @ApiProperty({ description: 'Data de vencimento (YYYY-MM-DD).' })
  vencimento!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Data de pagamento (YYYY-MM-DD).' })
  pagoEm!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Página do recibo/fatura hospedada pela Asaas.' })
  reciboUrl!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Página do boleto hospedada pela Asaas.' })
  boletoUrl!: string | null;
}
