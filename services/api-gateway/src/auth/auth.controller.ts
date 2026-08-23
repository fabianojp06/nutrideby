import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterNutricionistaDto } from './dto/register-nutricionista.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Autoatendimento: nutricionista cria a própria conta (Controladora).
  // Pacientes são cadastrados pelo nutricionista — ver PacientesModule.
  @Post('nutricionistas/registro')
  registrarNutricionista(@Body() dto: RegisterNutricionistaDto) {
    return this.authService.registerNutricionista(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
