import { SetMetadata } from '@nestjs/common';

// Marca uma rota como dependente de dado de saúde do paciente autenticado.
// Combinar com ConsentGuard: bloqueia o acesso enquanto o Termo de
// Consentimento (LGPD) não estiver com status ACEITO.
export const REQUIRE_CONSENT_KEY = 'requireConsent';
export const RequireConsent = () => SetMetadata(REQUIRE_CONSENT_KEY, true);
