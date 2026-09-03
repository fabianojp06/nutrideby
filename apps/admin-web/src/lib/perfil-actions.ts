"use server";

import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

export interface AtualizarPerfilState {
  erro?: string;
  sucesso?: string;
}

// Normaliza para dígitos: aceita CPF/CNPJ com ou sem máscara (o backend
// também aceita ambos, mas enviamos só dígitos para evitar ambiguidade).
function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

// US-checkout (item A): grava CPF/CNPJ no perfil da nutri via
// PATCH /nutricionistas/me. Necessário antes de converter o trial em plano
// pago (a Asaas exige um cliente com documento fiscal).
export async function atualizarPerfil(
  _prev: AtualizarPerfilState,
  formData: FormData
): Promise<AtualizarPerfilState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const cpfCnpjBruto = String(formData.get("cpfCnpj") ?? "").trim();
  const cpfCnpj = apenasDigitos(cpfCnpjBruto);

  if (cpfCnpjBruto && cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    return {
      erro: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.",
    };
  }

  const payload: Record<string, unknown> = {};
  if (nome) payload.nome = nome;
  if (telefone) payload.telefone = telefone;
  if (cpfCnpj) payload.cpfCnpj = cpfCnpj;

  if (Object.keys(payload).length === 0) {
    return { erro: "Nada para atualizar." };
  }

  try {
    await request("/nutricionistas/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 400) {
        return { erro: "cpfCnpj deve ser um CPF ou CNPJ válido." };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível atualizar o perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/assinatura");
  return { sucesso: "Perfil atualizado com sucesso." };
}
