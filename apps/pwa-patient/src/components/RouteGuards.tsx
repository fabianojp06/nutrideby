import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Bloqueia qualquer tela de dado de saúde até o Termo de Consentimento
// ser aceito explicitamente (obrigatório por CLAUDE.md / LGPD).
export function RequireConsent() {
  const { accepted } = useConsent();
  if (!accepted) return <Navigate to="/consentimento" replace />;
  return <Outlet />;
}
