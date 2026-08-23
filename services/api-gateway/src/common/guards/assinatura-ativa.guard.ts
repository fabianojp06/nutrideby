import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StatusAssinatura } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_ASSINATURA_ATIVA_KEY } from '../decorators/require-assinatura-ativa.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';

// Tolerância antes de suspender acesso por inadimplência (US-17, critério
// de aceite: "falha de pagamento suspende acesso após período de
// tolerância (ex.: 3 dias) com aviso prévio"). O "aviso prévio" em si
// (notificação ao nutricionista) não é responsabilidade deste guard — ver
// TODO abaixo.
const TOLERANCIA_DIAS = 3;

@Injectable()
export class AssinaturaAtivaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresAssinaturaAtiva = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ASSINATURA_ATIVA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiresAssinaturaAtiva) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user || user.role !== 'NUTRICIONISTA') return true;

    const assinatura = await this.prisma.assinatura.findUnique({
      where: { nutricionistaId: user.sub },
      select: { status: true, inadimplenteDesde: true },
    });

    if (!assinatura) {
      throw new ForbiddenException('Nenhuma assinatura encontrada. Assine um plano para continuar.');
    }

    if (assinatura.status === StatusAssinatura.CANCELADA) {
      throw new ForbiddenException('Assinatura cancelada. Reative um plano para continuar.');
    }

    if (assinatura.status === StatusAssinatura.INADIMPLENTE && assinatura.inadimplenteDesde) {
      const limiteToleranciaMs = TOLERANCIA_DIAS * 24 * 60 * 60 * 1000;
      const emAtrasoDesde = Date.now() - assinatura.inadimplenteDesde.getTime();

      if (emAtrasoDesde > limiteToleranciaMs) {
        throw new ForbiddenException(
          `Acesso suspenso por pagamento em atraso há mais de ${TOLERANCIA_DIAS} dias. Regularize sua assinatura para continuar.`,
        );
      }
      // Dentro da tolerância: acesso liberado.
      // TODO: disparar aviso ao nutricionista (e-mail/Telegram) assim que o
      // canal de notificação estiver definido — ver
      // docs/compliance/NutriDeby_Aditivo_DPA_{Telegram,Email}.md.
    }

    return true;
  }
}
