"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError, request } from "@/lib/apiClient";

export interface CriarPacienteState {
  erro?: string;
}

// US-03: a nutricionista cadastra o paciente COM senha (POST /pacientes).
// É esse fluxo que dá credenciais ao paciente e destrava o login dele na PWA.
// Dado de saúde/consentimento: o paciente nasce em statusConsentimento=PENDENTE
// no gateway; o Termo é assinado depois pelo próprio paciente (US-04).
export async function criarPaciente(
  _prev: CriarPacienteState,
  formData: FormData
): Promise<CriarPacienteState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const telefone = String(formData.get("telefone") ?? "").trim();
  const dataNascimento = String(formData.get("dataNascimento") ?? "").trim();
  const sexoBiologico = String(formData.get("sexoBiologico") ?? "").trim();

  if (!nome || !email || !senha) {
    return { erro: "Preencha nome, e-mail e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha inicial do paciente deve ter ao menos 8 caracteres." };
  }

  const payload: Record<string, unknown> = { nome, email, senha };
  if (telefone) payload.telefone = telefone;
  if (dataNascimento) payload.dataNascimento = dataNascimento; // YYYY-MM-DD (IsDateString)
  if (sexoBiologico === "MASCULINO" || sexoBiologico === "FEMININO") {
    payload.sexoBiologico = sexoBiologico;
  }

  try {
    await request("/pacientes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { erro: "Sessão expirada. Entre novamente." };
      if (e.status === 403) {
        return { erro: "Ative um plano de assinatura para cadastrar pacientes." };
      }
      if (e.status === 409) {
        return { erro: "Já existe um paciente com este e-mail." };
      }
      return { erro: e.message };
    }
    return { erro: "Não foi possível cadastrar o paciente." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
