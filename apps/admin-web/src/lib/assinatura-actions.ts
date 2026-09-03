"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

// Inicia o teste grátis de 14 dias (POST /assinaturas/trial no gateway) para
// a nutri logada. Sem cartão/Asaas. Após ativar, leva ao dashboard.
export async function iniciarTrial() {
  try {
    await request("/assinaturas/trial", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch (e) {
    // 409 = já possui assinatura: segue para o dashboard mesmo assim.
    if (!(e instanceof ApiError && e.status === 409)) throw e;
  }
  revalidatePath("/assinatura");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export type PlanoPago = "STARTER" | "PRO" | "CLINICA";

export interface ConverterParaPagoState {
  erro?: string;
  sucesso?: string;
  // Sinaliza à UI que falta CPF/CNPJ no perfil, para levar ao /perfil em vez
  // de mostrar erro cru.
  faltaCpfCnpj?: boolean;
}

// Item 4 do backlog (checkout Asaas): converte o trial em plano pago via
// POST /assinaturas/converter-para-pago. O sucesso NÃO ativa a assinatura na
// hora — o gateway gera a cobrança na Asaas e a ativação só ocorre quando o
// webhook confirmar o pagamento. Deixamos isso explícito na mensagem.
export async function converterParaPago(
  plano: PlanoPago
): Promise<ConverterParaPagoState> {
  try {
    await request("/assinaturas/converter-para-pago", {
      method: "POST",
      body: JSON.stringify({ plano }),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 400) {
        return {
          faltaCpfCnpj: true,
          erro:
            "Complete seu CPF/CNPJ no perfil antes de assinar um plano pago.",
        };
      }
      if (e.status === 404) {
        return {
          erro:
            "Você ainda não tem uma assinatura. Inicie o teste grátis antes de assinar um plano pago.",
        };
      }
      if (e.status === 409) {
        return {
          erro:
            "Já existe uma assinatura ativa ou uma cobrança pendente para esta conta.",
        };
      }
      if (e.status === 503) {
        return {
          erro:
            "O gateway de pagamento está indisponível no momento. Tente novamente em instantes.",
        };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível gerar a cobrança do plano." };
  }

  revalidatePath("/assinatura");
  return {
    sucesso:
      "Cobrança gerada — sua assinatura será ativada assim que o pagamento for confirmado.",
  };
}
