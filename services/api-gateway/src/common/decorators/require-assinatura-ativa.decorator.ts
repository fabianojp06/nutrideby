import { SetMetadata } from '@nestjs/common';

// Marca uma rota como dependente de assinatura em dia. Combinar com
// AssinaturaAtivaGuard: bloqueia nutricionistas com assinatura CANCELADA,
// ou INADIMPLENTE além do período de tolerância (US-17).
export const REQUIRE_ASSINATURA_ATIVA_KEY = 'requireAssinaturaAtiva';
export const RequireAssinaturaAtiva = () => SetMetadata(REQUIRE_ASSINATURA_ATIVA_KEY, true);
