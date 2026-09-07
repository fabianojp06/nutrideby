"use server";

import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

// Item 20 (fase 3): a anamnese auto-declarada é RELATO do paciente, nunca vira
// prontuário sozinha. Esta ação só MARCA a anamnese como incorporada
// (PATCH /pacientes/:pacienteId/anamnese/:id/incorporar) — o prontuário oficial
// é criado à parte pela nutri (POST /pacientes/:id/prontuarios). Idempotente:
// chamar de novo em algo já INCORPORADA é aceitável.
export interface IncorporarAnamneseState {
  erro?: string;
  sucesso?: string;
}

export async function incorporarAnamnese(
  pacienteId: string,
  anamneseId: string
): Promise<IncorporarAnamneseState> {
  try {
    await request(
      `/pacientes/${pacienteId}/anamnese/${anamneseId}/incorporar`,
      { method: "PATCH" }
    );
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return {
          erro: "Este paciente não pertence à sua conta ou sua assinatura não está ativa.",
        };
      }
      if (e.status === 404) return { erro: "Anamnese não encontrada." };
      return { erro: e.message };
    }
    return { erro: "Não foi possível marcar a anamnese como incorporada." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: "Anamnese incorporada ao prontuário." };
}
