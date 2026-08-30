"use server";

import { cookies } from "next/headers";
import { ApiError, requestPublic, TOKEN_COOKIE } from "@/lib/apiClient";

// Resposta do POST /auth/login e /auth/nutricionistas/registro no gateway
// (ver auth.service.ts: emitirTokens).
interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

export interface AuthActionState {
  erro?: string;
}

// Decisão de armazenamento do token (ver relatório): cookie httpOnly setado
// no servidor Next. Server Components não leem localStorage, e manter o token
// fora do JS do navegador reduz a superfície de XSS sobre credencial que dá
// acesso a dado de saúde. maxAge alinhado ao exp padrão do JWT do gateway.
function gravarToken(accessToken: string) {
  cookies().set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h — ajustar se o TTL do JWT mudar no gateway.
  });
}

export async function loginNutricionista(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  try {
    const resposta = await requestPublic<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha, role: "NUTRICIONISTA" }),
    });
    gravarToken(resposta.accessToken);
    return {};
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { erro: "Credenciais inválidas." };
    }
    return { erro: "Não foi possível entrar. Tente novamente." };
  }
}

export async function registrarNutricionista(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const crn = String(formData.get("crn") ?? "").trim();

  if (!nome || !email || !senha || !crn) {
    return { erro: "Preencha nome, CRN, e-mail e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha deve ter ao menos 8 caracteres." };
  }

  try {
    // GAP: o endpoint de registro (RegisterNutricionistaDto) não recebe
    // cpfCnpj nem plano de assinatura — o CPF/CNPJ é completado depois no
    // perfil e a assinatura/checkout (Asaas) é um fluxo separado ainda não
    // ligado nesta tela. Ver relatório (tarefa backend/produto).
    const resposta = await requestPublic<AuthResponse>(
      "/auth/nutricionistas/registro",
      {
        method: "POST",
        body: JSON.stringify({ nome, email, senha, crn }),
      }
    );
    gravarToken(resposta.accessToken);
    return {};
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      return { erro: "E-mail ou CRN já cadastrado." };
    }
    return { erro: "Não foi possível criar a conta. Tente novamente." };
  }
}

export async function logout() {
  cookies().delete(TOKEN_COOKIE);
}
