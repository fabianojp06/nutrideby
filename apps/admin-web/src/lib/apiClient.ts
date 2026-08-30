// Módulo server-only na prática: importa next/headers (cookies), que só
// resolve em Server Components / Server Actions / Route Handlers.
import { cookies } from "next/headers";

// Cliente HTTP central para o services/api-gateway (NestJS, prefixo global
// /api). Espelha o desenho do apps/pwa-patient (apiClient.ts): base URL via
// env, classe ApiError e injeção automática do token. Diferença: no admin-web
// (Next App Router) as páginas são Server Components, então o token vem do
// cookie httpOnly (não de localStorage — inacessível no servidor) e as
// chamadas saem do servidor Next para o gateway (server-to-server, sem CORS
// nem exposição de dado de saúde ao JS do navegador).

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export const TOKEN_COOKIE = "nutrideby_admin_token";

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken = token ?? cookies().get(TOKEN_COOKIE)?.value ?? undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    // Dado sensível e por-usuário: nunca cachear no data cache do Next.
    cache: "no-store",
  });

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    const mensagem = corpo?.message ?? `Erro na requisição (${response.status})`;
    throw new ApiError(
      response.status,
      Array.isArray(mensagem) ? mensagem.join(" ") : mensagem
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// Variante sem cookie/sem server-only para o fluxo de login (ainda não há
// token). Mantida aqui para reaproveitar API_BASE_URL e ApiError.
export async function requestPublic<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    const mensagem = corpo?.message ?? `Erro na requisição (${response.status})`;
    throw new ApiError(
      response.status,
      Array.isArray(mensagem) ? mensagem.join(" ") : mensagem
    );
  }

  return (await response.json()) as T;
}
