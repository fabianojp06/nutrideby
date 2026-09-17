// Fonte ÚNICA de verdade dos campos de dado de saúde criptografados em repouso.
// Usada por: (1) a extensão do Prisma (cifra/decifra transparente), (2) o
// script de backfill de produção, (3) o gate de CI que verifica que todo campo
// sensível está coberto. Ao adicionar um campo de saúde no schema, inclua-o
// aqui — o teste de cobertura falha se um modelo de saúde ganhar campo fora
// desta lista.
//
// `kind` define como serializar antes de cifrar (o ciphertext é sempre texto):
//  - 'string': texto puro (anamnese, histórico clínico, diário…)
//  - 'number': valor numérico (antropometria) — String(n) antes de cifrar,
//              Number(txt) ao decifrar; a coluna no banco passa a ser String.
//  - 'json':   objeto/array (refeições do plano) — JSON.stringify/parse; a
//              coluna no banco passa a ser String.

export type EncryptedFieldKind = 'string' | 'number' | 'json';

// Chave = nome do model no Prisma Client (camelCase do delegate).
export const ENCRYPTED_FIELDS: Record<string, Record<string, EncryptedFieldKind>> = {
  prontuario: {
    queixaPrincipal: 'string',
    historicoClinico: 'string',
    historicoFamiliar: 'string',
    habitosAlimentares: 'string',
    usoMedicamentos: 'string',
    alergias: 'string',
    intolerancias: 'string',
    nivelAtividadeFisica: 'string',
    observacoesGerais: 'string',
    pesoKg: 'number',
    alturaCm: 'number',
    circunferenciaCintura: 'number',
    circunferenciaQuadril: 'number',
    percentualGordura: 'number',
    imc: 'number',
  },
  registroPeso: {
    pesoKg: 'number',
  },
  registroDiario: {
    texto: 'string',
  },
  anamneseAutodeclarada: {
    objetivo: 'string',
    queixaPrincipal: 'string',
    historicoClinico: 'string',
    historicoFamiliar: 'string',
    habitosAlimentares: 'string',
    usoMedicamentos: 'string',
    alergias: 'string',
    intolerancias: 'string',
    nivelAtividadeFisica: 'string',
    preferenciasAversoes: 'string',
    rotinaRefeicoes: 'string',
    consumoAgua: 'string',
    habitoIntestinal: 'string',
    sono: 'string',
    consumoAlcool: 'string',
    tabagismo: 'string',
    gestacaoLactacao: 'string',
    praticaExercicio: 'string',
    suplementos: 'string',
    observacoesGerais: 'string',
    pesoDeclaradoKg: 'number',
    alturaDeclaradaCm: 'number',
  },
  planoAlimentar: {
    objetivo: 'string',
    observacoes: 'string',
    refeicoes: 'json',
  },
};

/** Serializa um valor de domínio para texto, conforme o kind, antes de cifrar. */
export function serializeForEncryption(
  value: unknown,
  kind: EncryptedFieldKind,
): string | null | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (kind === 'json') return JSON.stringify(value);
  return String(value);
}

/** Converte o texto decifrado de volta para o tipo de domínio, conforme o kind. */
export function deserializeAfterDecryption(value: unknown, kind: EncryptedFieldKind): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  // 'number': devolvido como string (texto numérico). Preserva o shape atual
  // da API — colunas Decimal do Prisma já serializavam como string no JSON —
  // e evita perda de precisão. O front converte com parseFloat quando precisa.
  if (kind === 'number') {
    return value;
  }
  if (kind === 'json') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
