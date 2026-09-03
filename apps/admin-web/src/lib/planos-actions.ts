"use server";

import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

export interface AprovarPlanoState {
  erro?: string;
  sucesso?: string;
}

// Item 17 (fatia 1): aprova um plano alimentar via
// PATCH /pacientes/:pacienteId/planos-alimentares/:id { aprovadoPeloNutri: true }.
// Ação SENSÍVEL de compliance: aprovar libera o plano (incluindo rascunho de IA)
// para o paciente ver na PWA (rotas /me/* filtram aprovadoPeloNutri=true). Por
// isso a confirmação irreversível fica na UI (client component) antes de chamar.
export async function aprovarPlano(
  pacienteId: string,
  planoId: string
): Promise<AprovarPlanoState> {
  try {
    await request(
      `/pacientes/${pacienteId}/planos-alimentares/${planoId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ aprovadoPeloNutri: true }),
      }
    );
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return { erro: "Este paciente não pertence à sua conta." };
      }
      if (e.status === 404) {
        return { erro: "Plano não encontrado." };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível aprovar o plano." };
  }

  // Atualiza o status na própria página do plano e na do paciente (badge/lista).
  revalidatePath(`/planos/${planoId}`);
  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: "Plano aprovado e liberado para o paciente." };
}

export interface DuplicarPlanoState {
  erro?: string;
  sucesso?: string;
  novoPlano?: { id: string; pacienteId: string };
}

interface PlanoDuplicadoApi {
  id: string;
  pacienteId: string;
}

// Item 17 (fatia 2): duplica um plano alimentar via
// POST /pacientes/:pacienteOrigemId/planos-alimentares/:id/duplicar
// { pacienteDestinoId }. A cópia nasce aprovadoPeloNutri=false (rascunho, NÃO
// visível ao paciente) e preserva a origem (cópia de rascunho de IA continua
// marcada como IA). A resposta é o plano novo — devolvemos id/pacienteId para
// a UI navegar até a cópia.
export async function duplicarPlano(
  pacienteOrigemId: string,
  planoId: string,
  pacienteDestinoId: string
): Promise<DuplicarPlanoState> {
  let novoPlano: PlanoDuplicadoApi;
  try {
    novoPlano = await request<PlanoDuplicadoApi>(
      `/pacientes/${pacienteOrigemId}/planos-alimentares/${planoId}/duplicar`,
      {
        method: "POST",
        body: JSON.stringify({ pacienteDestinoId }),
      }
    );
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return { erro: "Paciente de origem ou destino não pertence à sua conta." };
      }
      if (e.status === 404) {
        return { erro: "Plano não encontrado." };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível duplicar o plano." };
  }

  // A cópia aparece na lista de planos do paciente destino.
  revalidatePath(`/pacientes/${pacienteDestinoId}`);
  return {
    sucesso: "Plano duplicado como rascunho.",
    novoPlano: { id: novoPlano.id, pacienteId: novoPlano.pacienteId },
  };
}

export interface FonteRag {
  source: string;
  trecho: string;
  similaridade: number;
}

export interface RascunhoIa {
  rascunho: string;
  fontesUtilizadas: FonteRag[];
  modeloUtilizado: string;
  disclaimer: string;
}

export interface RascunhoIaState {
  erro?: string;
  rascunho?: RascunhoIa;
}

// Item 17 (fatia 3): gera um RASCUNHO por IA (Agente Clínico RAG) via
// POST /pacientes/:pacienteId/planos-alimentares/rascunho-ia { perguntaNutricionista }.
// COMPLIANCE: o retorno é OUTPUT DE IA CLÍNICA, exibido SOMENTE para a nutri como
// referência. NÃO é um plano, NÃO persiste nada e NÃO vai ao paciente. Por isso
// não há revalidate nem redirect (nenhum estado persistido muda). O disclaimer
// CFN vem no corpo e é exibido com destaque na UI (Código de Ética CFN).
export async function gerarRascunhoIA(
  pacienteId: string,
  perguntaNutricionista: string
): Promise<RascunhoIaState> {
  try {
    const rascunho = await request<RascunhoIa>(
      `/pacientes/${pacienteId}/planos-alimentares/rascunho-ia`,
      {
        method: "POST",
        body: JSON.stringify({ perguntaNutricionista }),
      }
    );
    return { rascunho };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return {
          erro: "O Agente Clínico é exclusivo dos planos Pro e Clínica.",
        };
      }
      if (e.status === 400) {
        // Mensagem do backend orienta a registrar anamnese/antropometria antes.
        return { erro: e.message };
      }
      if (e.status === 503) {
        return {
          erro: "O Agente Clínico está indisponível ou demorou a responder. Tente novamente.",
        };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível gerar o rascunho." };
  }
}
