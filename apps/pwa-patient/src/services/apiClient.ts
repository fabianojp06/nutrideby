// Cliente HTTP central para o services/api-gateway (NestJS, prefixo global /api).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token setado pelo useAuth no login/hidratação inicial — evita passar o
// token manualmente em toda chamada de página/hook.
let currentToken: string | null = null;
export function setAuthToken(token: string | null) {
  currentToken = token;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken = token ?? currentToken ?? undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    const mensagem = corpo?.message ?? `Erro na requisição (${response.status})`;
    throw new ApiError(response.status, Array.isArray(mensagem) ? mensagem.join(' ') : mensagem);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = { request };
