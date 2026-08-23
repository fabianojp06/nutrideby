import {
  Fatura,
  Nutricionista,
  Paciente,
  PlanoAlimentar,
  Prontuario,
} from "@/types";

/**
 * Dados mockados/estáticos — sem backend real conectado ainda.
 * Substituir por chamadas a services/api-gateway quando disponível (ver src/lib/api.ts).
 */

export const nutricionistaAtual: Nutricionista = {
  id: "nutri-1",
  nome: "Débora Oliveira",
  email: "debora@nutrideby.com.br",
  crn: "CRN-3 12345",
  cpfCnpj: "123.456.789-00",
  plano: "pro",
};

export const pacientesMock: Paciente[] = [
  {
    id: "pac-1",
    nome: "Ana Beatriz Souza",
    email: "ana.souza@example.com",
    telefone: "(11) 98888-1234",
    dataNascimento: "1990-04-12",
    status: "ativo",
    ultimaConsulta: "2026-08-10",
  },
  {
    id: "pac-2",
    nome: "Carlos Eduardo Lima",
    email: "carlos.lima@example.com",
    telefone: "(11) 97777-5678",
    dataNascimento: "1985-11-02",
    status: "ativo",
    ultimaConsulta: "2026-08-15",
  },
  {
    id: "pac-3",
    nome: "Fernanda Costa",
    email: "fernanda.costa@example.com",
    telefone: "(21) 96666-4321",
    dataNascimento: "1998-01-20",
    status: "aguardando_consentimento",
  },
  {
    id: "pac-4",
    nome: "João Pedro Martins",
    email: "joao.martins@example.com",
    telefone: "(31) 95555-8765",
    dataNascimento: "1978-07-30",
    status: "inativo",
    ultimaConsulta: "2026-05-02",
  },
];

export const prontuariosMock: Record<string, Prontuario> = {
  "pac-1": {
    pacienteId: "pac-1",
    anamnese: {
      queixaPrincipal: "Emagrecimento e reeducação alimentar",
      historicoAlimentar:
        "Alimentação rica em ultraprocessados, baixa ingestão de fibras.",
      restricoes: ["Lactose"],
      condicoesClinicas: ["Resistência à insulina"],
      atualizadoEm: "2026-08-10",
    },
    antropometria: [
      { data: "2026-05-10", pesoKg: 78.5, alturaCm: 165, imc: 28.8 },
      { data: "2026-06-10", pesoKg: 76.9, alturaCm: 165, imc: 28.3 },
      { data: "2026-07-10", pesoKg: 75.2, alturaCm: 165, imc: 27.6 },
      { data: "2026-08-10", pesoKg: 73.8, alturaCm: 165, imc: 27.1 },
    ],
  },
  "pac-2": {
    pacienteId: "pac-2",
    anamnese: {
      queixaPrincipal: "Ganho de massa muscular",
      historicoAlimentar: "Boa ingestão proteica, poucas refeições ao dia.",
      restricoes: [],
      condicoesClinicas: [],
      atualizadoEm: "2026-08-15",
    },
    antropometria: [
      { data: "2026-06-15", pesoKg: 70.0, alturaCm: 178, imc: 22.1 },
      { data: "2026-07-15", pesoKg: 71.4, alturaCm: 178, imc: 22.5 },
      { data: "2026-08-15", pesoKg: 72.6, alturaCm: 178, imc: 22.9 },
    ],
  },
};

export const planosAlimentaresMock: PlanoAlimentar[] = [
  {
    id: "plano-1",
    pacienteId: "pac-1",
    nome: "Plano de reeducação alimentar — Fase 1",
    criadoEm: "2026-08-11",
    origem: "ia_rascunho",
    aprovado: true,
    refeicoes: [
      {
        id: "ref-1",
        nome: "Café da manhã",
        horario: "07:00",
        itens: [
          {
            id: "item-1",
            nome: "Ovo mexido",
            quantidade: "2 unidades",
            fonte: "TACO",
            kcal: 146,
            proteinasG: 13,
            carboidratosG: 1,
            gordurasG: 10,
          },
          {
            id: "item-2",
            nome: "Pão integral",
            quantidade: "2 fatias",
            fonte: "TACO",
            kcal: 138,
            proteinasG: 6,
            carboidratosG: 24,
            gordurasG: 2,
          },
        ],
      },
      {
        id: "ref-2",
        nome: "Almoço",
        horario: "12:30",
        itens: [
          {
            id: "item-3",
            nome: "Arroz integral",
            quantidade: "4 col. sopa",
            fonte: "TACO",
            kcal: 154,
            proteinasG: 3,
            carboidratosG: 32,
            gordurasG: 1,
          },
          {
            id: "item-4",
            nome: "Peito de frango grelhado",
            quantidade: "120g",
            fonte: "TBCA",
            kcal: 198,
            proteinasG: 37,
            carboidratosG: 0,
            gordurasG: 4,
          },
        ],
      },
    ],
  },
];

export const faturasMock: Fatura[] = [
  { id: "fat-1", competencia: "Ago/2026", valor: 189.9, status: "paga", vencimento: "2026-08-05" },
  { id: "fat-2", competencia: "Jul/2026", valor: 189.9, status: "paga", vencimento: "2026-07-05" },
  { id: "fat-3", competencia: "Jun/2026", valor: 189.9, status: "paga", vencimento: "2026-06-05" },
  { id: "fat-4", competencia: "Mai/2026", valor: 189.9, status: "falhou", vencimento: "2026-05-05" },
];

export const planosPrecos: Record<
  "starter" | "pro" | "clinica",
  { nome: string; preco: number; limitePacientes: string }
> = {
  starter: { nome: "Starter", preco: 89.9, limitePacientes: "até 20 pacientes" },
  pro: { nome: "Pro", preco: 189.9, limitePacientes: "até 80 pacientes" },
  clinica: { nome: "Clínica", preco: 349.9, limitePacientes: "pacientes ilimitados" },
};
