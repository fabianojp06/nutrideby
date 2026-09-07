import { ApiProperty } from '@nestjs/swagger';

// Shape público do nutricionista autenticado — espelha o `selectPublico()` do
// NutricionistasService. É a resposta de GET e PATCH /nutricionistas/me e entra
// no contrato OpenAPI (item 7): o admin-web consome este tipo, não o redefine.
export class NutricionistaMeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  crn!: string;

  @ApiProperty({ type: String, nullable: true })
  telefone!: string | null;

  @ApiProperty({ type: String, nullable: true })
  cpfCnpj!: string | null;

  @ApiProperty()
  ativo!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;
}
