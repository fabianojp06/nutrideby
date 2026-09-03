import { IsIn } from 'class-validator';

export class ConverterParaPagoDto {
  @IsIn(['STARTER', 'PRO', 'CLINICA'])
  plano!: 'STARTER' | 'PRO' | 'CLINICA';
}
