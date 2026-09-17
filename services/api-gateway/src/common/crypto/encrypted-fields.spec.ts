import { Prisma } from '@prisma/client';
import { ENCRYPTED_FIELDS } from './encrypted-fields';

// Gate de compliance (item 12): impede que um campo de dado de saúde escape da
// criptografia de campo. Se alguém adicionar um String/Decimal novo num modelo
// de saúde, este teste FALHA até o campo ser (a) incluído na registry de campos
// cifrados, ou (b) declarado explicitamente como não-sensível no allowlist
// abaixo — decisão consciente, nunca silenciosa.

// Modelos que carregam dado de saúde do paciente.
const HEALTH_MODELS = [
  'Prontuario',
  'RegistroPeso',
  'RegistroDiario',
  'AnamneseAutodeclarada',
  'PlanoAlimentar',
];

// Campos String/Decimal desses modelos que NÃO são dado de saúde sensível
// (rótulos, ponteiros, metadados). Manter curto e justificado.
const NON_SENSITIVE_ALLOWLIST: Record<string, string[]> = {
  Prontuario: ['id', 'pacienteId'],
  RegistroPeso: ['id', 'pacienteId'],
  RegistroDiario: ['id', 'pacienteId', 'fotoUrl'], // URL é ponteiro; o arquivo vive em storage externo
  AnamneseAutodeclarada: ['id', 'pacienteId', 'incorporadoPorNutriId'],
  PlanoAlimentar: ['id', 'pacienteId', 'titulo'], // título é rótulo do plano
};

const delegateKey = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

describe('cobertura da cripto de campo (dado de saúde)', () => {
  const models = Prisma.dmmf.datamodel.models;

  it.each(HEALTH_MODELS)('todo campo texto/decimal sensível de %s está coberto', (modelName) => {
    const model = models.find((m) => m.name === modelName);
    expect(model).toBeDefined();

    const registrados = ENCRYPTED_FIELDS[delegateKey(modelName)] ?? {};
    const allow = NON_SENSITIVE_ALLOWLIST[modelName] ?? [];

    const escapou = model!.fields
      .filter((f) => f.kind === 'scalar' && (f.type === 'String' || f.type === 'Decimal'))
      .map((f) => f.name)
      .filter((name) => !(name in registrados) && !allow.includes(name));

    expect(escapou).toEqual([]);
  });

  it('não há campo na registry que não exista mais no schema', () => {
    for (const modelName of HEALTH_MODELS) {
      const model = models.find((m) => m.name === modelName)!;
      const nomes = new Set(model.fields.map((f) => f.name));
      const registrados = Object.keys(ENCRYPTED_FIELDS[delegateKey(modelName)] ?? {});
      const fantasmas = registrados.filter((f) => !nomes.has(f));
      expect(fantasmas).toEqual([]);
    }
  });
});
