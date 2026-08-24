import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { acceptConsentTerm } from '@/services/api';
import { useAuth } from './useAuth';

interface ConsentState {
  accepted: boolean;
  accept: (termId: string) => Promise<void>;
}

const ConsentContext = createContext<ConsentState | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Fonte de verdade é o backend (statusConsentimento do JWT emitido no
  // login), não uma flag local desacoplada — evita a tela liberar acesso
  // no navegador enquanto o servidor ainda bloqueia (ou vice-versa).
  const { statusConsentimento } = useAuth();
  const [accepted, setAccepted] = useState(statusConsentimento === 'ACEITO');

  useEffect(() => {
    setAccepted(statusConsentimento === 'ACEITO');
  }, [statusConsentimento]);

  const value = useMemo<ConsentState>(
    () => ({
      accepted,
      // Regra de compliance: nenhuma tela de dado de saúde é acessível
      // antes da confirmação explícita do Termo de Consentimento (LGPD).
      accept: async (termId: string) => {
        await acceptConsentTerm(termId);
        setAccepted(true);
      },
    }),
    [accepted],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentState {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent deve ser usado dentro de ConsentProvider');
  return ctx;
}
