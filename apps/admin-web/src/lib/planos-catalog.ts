import { PlanoAssinatura, PlanoAssinaturaApi } from "@/types";

// Catálogo de planos exibido na UI. GAP: o gateway NÃO expõe um endpoint de
// catálogo (preços/limites vivem em constantes do backend — PRECO_POR_PLANO
// em assinaturas.service.ts e LIMITE_PACIENTES_POR_PLANO em common/planos.ts).
// Mantido estático aqui, com valores alinhados aos do backend. Ver relatório.
export const planosPrecos: Record<
  PlanoAssinatura,
  { nome: string; preco: number; limitePacientes: string }
> = {
  starter: { nome: "Starter", preco: 49, limitePacientes: "até 15 pacientes" },
  pro: { nome: "Pro", preco: 129, limitePacientes: "até 60 pacientes" },
  clinica: { nome: "Clínica", preco: 299, limitePacientes: "pacientes ilimitados" },
};

export function planoApiParaCatalogo(
  plano: PlanoAssinaturaApi
): PlanoAssinatura {
  return plano.toLowerCase() as PlanoAssinatura;
}
