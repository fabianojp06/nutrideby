import { PlanoAssinatura } from '@prisma/client';

// Limite de pacientes ativos por plano (docs/produto/fase0_estrutura_planos_e_backlog.md).
// Clínica é ilimitado — Infinity nunca é atingido pela comparação `>=`.
export const LIMITE_PACIENTES_POR_PLANO: Record<PlanoAssinatura, number> = {
  STARTER: 15,
  PRO: 60,
  CLINICA: Infinity,
};

// Item 22: Agente Clínico RAG é diferencial do plano Pro — Starter não tem
// acesso (custo de tokens de IA fica reservado ao plano pago mais caro).
export const PLANOS_COM_ACESSO_RAG: PlanoAssinatura[] = ['PRO', 'CLINICA'];
