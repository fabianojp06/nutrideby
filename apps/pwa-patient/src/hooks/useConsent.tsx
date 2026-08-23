import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { acceptConsentTerm } from '@/services/mockApi';

interface ConsentState {
  accepted: boolean;
  accept: (termId: string) => Promise<void>;
}

const ConsentContext = createContext<ConsentState | undefined>(undefined);

const STORAGE_KEY = 'nutrideby.consent.accepted';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState<boolean>(
    localStorage.getItem(STORAGE_KEY) === 'true',
  );

  const value = useMemo<ConsentState>(
    () => ({
      accepted,
      // Regra de compliance: nenhuma tela de dado de saúde é acessível
      // antes da confirmação explícita do Termo de Consentimento (LGPD).
      accept: async (termId: string) => {
        await acceptConsentTerm(termId);
        localStorage.setItem(STORAGE_KEY, 'true');
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
