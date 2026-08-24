import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { login as apiLogin, LoginResult } from '@/services/api';
import { setAuthToken } from '@/services/apiClient';

interface AuthState {
  token: string | null;
  name: string | null;
  statusConsentimento: LoginResult['statusConsentimento'] | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = 'nutrideby.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const initial = stored ? (JSON.parse(stored) as LoginResult) : null;
  if (initial) setAuthToken(initial.token);

  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [name, setName] = useState<string | null>(initial?.name ?? null);
  const [statusConsentimento, setStatusConsentimento] = useState<LoginResult['statusConsentimento'] | null>(
    initial?.statusConsentimento ?? null,
  );

  const value = useMemo<AuthState>(
    () => ({
      token,
      name,
      statusConsentimento,
      isAuthenticated: Boolean(token),
      login: async (email, password) => {
        const result = await apiLogin(email, password);
        setAuthToken(result.token);
        setToken(result.token);
        setName(result.name);
        setStatusConsentimento(result.statusConsentimento);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      },
      logout: () => {
        setAuthToken(null);
        setToken(null);
        setName(null);
        setStatusConsentimento(null);
        sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, name, statusConsentimento],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
