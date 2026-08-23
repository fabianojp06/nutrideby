import { IsEmail, IsIn, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;

  @IsIn(['NUTRICIONISTA', 'PACIENTE'])
  role!: 'NUTRICIONISTA' | 'PACIENTE';
}
