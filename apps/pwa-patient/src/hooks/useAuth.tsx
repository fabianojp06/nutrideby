import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { login as apiLogin } from '@/services/mockApi';

interface AuthState {
  token: string | null;
  name: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = 'nutrideby.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const initial = stored ? (JSON.parse(stored) as { token: string; name: string }) : null;

  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [name, setName] = useState<string | null>(initial?.name ?? null);

  const value = useMemo<AuthState>(
    () => ({
      token,
      name,
      isAuthenticated: Boolean(token),
      login: async (email, password) => {
        const result = await apiLogin(email, password);
        setToken(result.token);
        setName(result.name);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      },
      logout: () => {
        setToken(null);
        setName(null);
        sessionStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, name],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
