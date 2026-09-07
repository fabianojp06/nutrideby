import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusAssinatura } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ApiOkResponse } from '@nestjs/swagger';
import { AssinaturasService } from './assinaturas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { ConverterParaPagoDto } from './dto/converter-para-pago.dto';
import { AsaasWebhookDto } from './dto/asaas-webhook.dto';
import { AssinaturaDto } from './dto/assinatura.dto';
import { FaturaDto } from './dto/fatura.dto';

// Eventos de cobrança da Asaas -> nosso enum StatusAssinatura. Só
// mapeamos os eventos relevantes para o ciclo de vida da assinatura;
// eventos não listados aqui são ignorados (retornam 200 sem efeito).
const EVENTO_PARA_STATUS: Partial<Record<string, StatusAssinatura>> = {
  PAYMENT_CONFIRMED: StatusAssinatura.ATIVA,
  PAYMENT_RECEIVED: StatusAssinatura.ATIVA,
  PAYMENT_OVERDUE: StatusAssinatura.INADIMPLENTE,
  SUBSCRIPTION_DELETED: StatusAssinatura.CANCELADA,
  PAYMENT_DELETED: StatusAssinatura.CANCELADA,
};

@Controller('assinaturas')
export class AssinaturasController {
  constructor(
    private readonly assinaturasService: AssinaturasService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('NUTRICIONISTA')
  @Post()
  @ApiOkResponse({ type: AssinaturaDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssinaturaDto) {
    return this.assinaturasService.create(user.sub, dto);
  }

  // Converte o trial atual em plano pago (cria cobrança recorrente na Asaas).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('NUTRICIONISTA')
  @Post('converter-para-pago')
  @ApiOkResponse({ type: AssinaturaDto })
  converterParaPago(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConverterParaPagoDto,
  ) {
    return this.assinaturasService.converterParaPago(user.sub, dto);
  }

  // Inicia o teste grátis de 14 dias sem cartão (self-service).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('NUTRICIONISTA')
  @Post('trial')
  @ApiOkResponse({ type: AssinaturaDto })
  iniciarTrial(@CurrentUser() user: AuthenticatedUser) {
    return this.assinaturasService.iniciarTrial(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('NUTRICIONISTA')
  @Get('me')
  @ApiOkResponse({ type: AssinaturaDto })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.assinaturasService.findMine(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('NUTRICIONISTA')
  @Get('me/faturas')
  @ApiOkResponse({ type: FaturaDto, isArray: true })
  listarFaturas(@CurrentUser() user: AuthenticatedUser) {
    return this.assinaturasService.listarFaturas(user.sub);
  }

  // Webhook público (chamado pela Asaas, não por um usuário autenticado do
  // NutriDeby) — autenticado por token compartilhado no header
  // `asaas-access-token`, configurado no painel da Asaas e em
  // ASAAS_WEBHOOK_TOKEN. Sem JwtAuthGuard de propósito.
  @Post('webhook/asaas')
  @HttpCode(200)
  async webhookAsaas(
    @Headers('asaas-access-token') token: string | undefined,
    @Body() dto: AsaasWebhookDto,
  ) {
    const tokenEsperado = this.config.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (!tokenEsperado || token !== tokenEsperado) {
      throw new BadRequestException('Token de webhook inválido.');
    }

    const novoStatus = EVENTO_PARA_STATUS[dto.event];
    if (novoStatus && dto.payment?.subscription) {
      await this.assinaturasService.atualizarStatusPorWebhook(dto.payment.subscription, novoStatus);
    }
    return { recebido: true };
  }
}
