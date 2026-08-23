import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Payload do webhook da Asaas — só tipamos os campos que consumimos.
// ValidationPipe global usa whitelist+forbidNonWhitelisted, então todo
// campo lido precisa de decorator (senão a Asaas manda o payload e o
// Nest rejeita por "propriedade não permitida").
class AsaasWebhookPaymentDto {
  @IsOptional()
  @IsString()
  subscription?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class AsaasWebhookDto {
  @IsString()
  event!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AsaasWebhookPaymentDto)
  payment?: AsaasWebhookPaymentDto;
}
