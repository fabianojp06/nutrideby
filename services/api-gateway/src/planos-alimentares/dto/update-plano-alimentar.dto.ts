import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/mapped-types';
import { CreatePlanoAlimentarDto } from './create-plano-alimentar.dto';

// `origem` é imutável após a criação — editar um plano não muda sua procedência.
// `aprovadoPeloNutri` nunca esteve aqui: aprovação é rota dedicada (POST :id/aprovar),
// editar não aprova nem rebaixa.
export class UpdatePlanoAlimentarDto extends PartialType(
  OmitType(CreatePlanoAlimentarDto, ['origem'] as const),
) {}
