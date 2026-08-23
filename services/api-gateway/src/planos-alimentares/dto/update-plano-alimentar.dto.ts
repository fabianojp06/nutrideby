import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanoAlimentarDto } from './create-plano-alimentar.dto';

export class UpdatePlanoAlimentarDto extends PartialType(CreatePlanoAlimentarDto) {}
