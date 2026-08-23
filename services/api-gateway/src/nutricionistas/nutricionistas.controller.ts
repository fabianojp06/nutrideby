import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { NutricionistasService } from './nutricionistas.service';
import { UpdateNutricionistaDto } from './dto/update-nutricionista.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRICIONISTA')
@Controller('nutricionistas/me')
export class NutricionistasController {
  constructor(private readonly nutricionistasService: NutricionistasService) {}

  @Get()
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.nutricionistasService.findMe(user.sub);
  }

  @Patch()
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateNutricionistaDto) {
    return this.nutricionistasService.updateMe(user.sub, dto);
  }
}
