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
