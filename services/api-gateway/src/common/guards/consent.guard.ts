import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_CONSENT_KEY } from '../decorators/require-consent.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';

// Bloqueia rotas de paciente enquanto o Termo de Consentimento (LGPD) não
// estiver assinado. Requisito não negociável: nenhum tratamento de dado de
// saúde do paciente antes do consentimento (ver CLAUDE.md — Regras de
// compliance). Consulta o banco em vez de confiar apenas no JWT, já que o
// status pode ter sido revogado após a emissão do token.
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresConsent = this.reflector.getAllAndOverride<boolean>(REQUIRE_CONSENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresConsent) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user || user.role !== 'PACIENTE') {
      // Rotas de paciente autenticadas por outro papel (ex: nutricionista
      // consultando o próprio paciente) seguem regras de autorização do
      // controller, não deste guard.
      return true;
    }

    const paciente = await this.prisma.paciente.findUnique({
      where: { id: user.sub },
      select: { statusConsentimento: true },
    });

    if (!paciente || paciente.statusConsentimento !== 'ACEITO') {
      throw new ForbiddenException(
        'Termo de Consentimento (LGPD) não assinado. Acesso bloqueado até a aceitação do termo.',
      );
    }

    return true;
  }
}
