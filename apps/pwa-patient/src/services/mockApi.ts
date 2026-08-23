// Mocks temporários dos endpoints do backend. Serão substituídos por chamadas
// reais ao services/api-gateway quando os contratos estiverem prontos.

export interface ConsentTerm {
  id: string;
  version: string;
  title: string;
  body: string;
}

export interface DailyProgress {
  kcalGoal: number;
  kcalConsumed: number;
  kcalRemaining: number;
  macros: { protein: number; carbs: number; fat: number };
  nextMeals: { time: string; label: string }[];
  weight: { current: number; deltaLastWeek: number };
  diaryEntriesToday: number;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface MealEntry {
  id: string;
  time: string;
  description: string;
  photoUrl?: string;
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchPendingConsentTerm(): Promise<ConsentTerm | null> {
  await delay();
  // LGPD: nenhum dado de saúde é tratado antes da aceitação deste termo.
  return {
    id: 'consent-2026-01',
    version: '1.0',
    title: 'Termo de Consentimento para Tratamento de Dados de Saúde',
    body:
      'Ao aceitar, você autoriza a NutriDeby a tratar seus dados de saúde ' +
      '(peso, alimentação, evolução clínica) para fins de acompanhamento ' +
      'nutricional, conforme a LGPD (Lei 13.709/2018). Seus dados são ' +
      'criptografados e acessados apenas pela equipe responsável pelo seu ' +
      'atendimento. Você pode revogar este consentimento a qualquer momento ' +
      'em Perfil > Privacidade.',
  };
}

export async function acceptConsentTerm(_termId: string): Promise<{ acceptedAt: string }> {
  await delay();
  return { acceptedAt: new Date().toISOString() };
}

export async function login(email: string, _password: string): Promise<{ token: string; name: string }> {
  await delay();
  return { token: 'mock-token', name: email.split('@')[0] || 'Paciente' };
}

export async function fetchDailyProgress(): Promise<DailyProgress> {
  await delay();
  return {
    kcalGoal: 2200,
    kcalConsumed: 360,
    kcalRemaining: 1840,
    macros: { protein: 120, carbs: 180, fat: 60 },
    nextMeals: [
      { time: '12:30', label: 'Almoço' },
      { time: '16:00', label: 'Lanche' },
      { time: '19:30', label: 'Jantar' },
    ],
    weight: { current: 68.4, deltaLastWeek: -0.6 },
    diaryEntriesToday: 0,
  };
}

export async function fetchWeightHistory(): Promise<WeightEntry[]> {
  await delay();
  return [
    { date: '2026-07-26', kg: 70.1 },
    { date: '2026-08-02', kg: 69.6 },
    { date: '2026-08-09', kg: 69.2 },
    { date: '2026-08-16', kg: 69.0 },
    { date: '2026-08-23', kg: 68.4 },
  ];
}

export async function registerWeight(kg: number): Promise<WeightEntry> {
  await delay();
  return { date: new Date().toISOString().slice(0, 10), kg };
}

export async function fetchDiaryEntries(): Promise<MealEntry[]> {
  await delay();
  return [];
}

export async function registerMealEntry(entry: Omit<MealEntry, 'id'>): Promise<MealEntry> {
  await delay();
  return { id: crypto.randomUUID(), ...entry };
}
