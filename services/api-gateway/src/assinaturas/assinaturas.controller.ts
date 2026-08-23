import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AssinaturasService } from './assinaturas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRICIONISTA')
@Controller('assinaturas')
export class AssinaturasController {
  constructor(private readonly assinaturasService: AssinaturasService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssinaturaDto) {
    return this.assinaturasService.create(user.sub, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.assinaturasService.findMine(user.sub);
  }
}
