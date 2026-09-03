"use server";

import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

// Item 18: dados que o editor de prontuário envia ao criar/atualizar uma
// consulta. Espelha os campos aceitos pelo backend (todos OPCIONAIS). Prontuário
// é DADO DE SAÚDE SENSÍVEL: só trafega em body de POST/PATCH (nunca em URL/query
// nem log). Não há IA aqui — sem disclaimer CFN.
export interface DadosProntuario {
  // Anamnese (texto livre)
  queixaPrincipal?: string;
  historicoClinico?: string;
  historicoFamiliar?: string;
  habitosAlimentares?: string;
  usoMedicamentos?: string;
  alergias?: string;
  intolerancias?: string;
  nivelAtividadeFisica?: string;
  observacoesGerais?: string;
  // Antropometria (números)
  pesoKg?: number;
  alturaCm?: number;
  circunferenciaCintura?: number;
  circunferenciaQuadril?: number;
  percentualGordura?: number;
  imc?: number;
}

interface ProntuarioCriadoApi {
  id: string;
  pacienteId: string;
}

export interface CriarProntuarioState {
  erro?: string;
  sucesso?: string;
}

// Item 18: REGISTRA uma nova consulta via
// POST /pacientes/:pacienteId/prontuarios. Cada prontuário é o snapshot de UMA
// consulta (a série antropométrica é o histórico deles), então a ação principal
// é CRIAR um novo, nunca sobrescrever. Nutri-only + assinatura ativa (guards no
// backend). Trata 401/403/404/400.
export async function criarProntuario(
  pacienteId: string,
  dados: DadosProntuario
): Promise<CriarProntuarioState> {
  try {
    await request<ProntuarioCriadoApi>(
      `/pacientes/${pacienteId}/prontuarios`,
      { method: "POST", body: JSON.stringify(dados) }
    );
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return {
          erro: "Este paciente não pertence à sua conta ou sua assinatura não está ativa.",
        };
      }
      if (e.status === 404) return { erro: "Paciente não encontrado." };
      if (e.status === 400) return { erro: e.message };
      return { erro: e.message };
    }
    return { erro: "Não foi possível registrar o prontuário." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: "Prontuário registrado." };
}

export interface AtualizarProntuarioState {
  erro?: string;
  sucesso?: string;
}

// Item 18: EDITA um prontuário existente (correção de uma consulta já lançada)
// via PATCH /pacientes/:pacienteId/prontuarios/:id (parcial, mesmos campos).
// Uso secundário — o fluxo padrão é criar uma nova consulta.
export async function atualizarProntuario(
  pacienteId: string,
  id: string,
  dados: DadosProntuario
): Promise<AtualizarProntuarioState> {
  try {
    await request(
      `/pacientes/${pacienteId}/prontuarios/${id}`,
      { method: "PATCH", body: JSON.stringify(dados) }
    );
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return {
          erro: "Este paciente não pertence à sua conta ou sua assinatura não está ativa.",
        };
      }
      if (e.status === 404) return { erro: "Prontuário não encontrado." };
      if (e.status === 400) return { erro: e.message };
      return { erro: e.message };
    }
    return { erro: "Não foi possível salvar o prontuário." };
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return { sucesso: "Prontuário salvo." };
}
