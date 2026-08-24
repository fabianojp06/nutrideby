// Leitura client-side do payload do JWT (sem verificar assinatura — só
// para exibir dados na UI, não para decisão de segurança; o backend
// revalida tudo). Payload esperado: ver AuthenticatedUser no api-gateway.
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'NUTRICIONISTA' | 'PACIENTE';
  statusConsentimento?: 'PENDENTE' | 'ACEITO' | 'REVOGADO';
  exp: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
