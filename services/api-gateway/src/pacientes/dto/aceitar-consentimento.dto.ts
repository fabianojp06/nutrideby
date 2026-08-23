import { IsString } from 'class-validator';

export class AceitarConsentimentoDto {
  // Versão do Termo de Consentimento exibido/aceito pelo paciente,
  // para rastreabilidade em caso de atualização do termo (LGPD).
  @IsString()
  versaoTermo!: string;
}
