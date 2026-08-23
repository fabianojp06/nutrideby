import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAssinaturaDto {
  @IsIn(['STARTER', 'PRO', 'CLINICA'])
  plano!: 'STARTER' | 'PRO' | 'CLINICA';

  // 14 dias de trial sem cartão obrigatório — calculado no service quando
  // ausente (ver fase0_estrutura_planos_e_backlog.md).
  @IsOptional()
  @IsString()
  trialAte?: string;
}
