import { Prisma } from '@prisma/client';
import { decryptField, encryptField } from '../common/crypto/field-crypto';
import {
  deserializeAfterDecryption,
  ENCRYPTED_FIELDS,
  EncryptedFieldKind,
  serializeForEncryption,
} from '../common/crypto/encrypted-fields';

// Extensão do Prisma Client que aplica cripto de campo (AES-256-GCM) de forma
// transparente: cifra os campos de saúde na escrita e decifra na leitura, com
// base na registry ENCRYPTED_FIELDS. Os serviços de domínio continuam lidando
// com os tipos naturais (número, objeto, texto) — a cripto é invisível para
// eles e para os DTOs.
//
// NÃO cifra cláusulas `where`: valor cifrado (IV aleatório) não é pesquisável,
// e nenhuma query filtra/ordena por esses campos (auditado no item 12).

function delegateKey(model: string | undefined): string | null {
  if (!model) return null;
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return ENCRYPTED_FIELDS[key] ? key : null;
}

function encryptData(fields: Record<string, EncryptedFieldKind>, data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const record = data as Record<string, unknown>;

  for (const [field, kind] of Object.entries(fields)) {
    if (!(field in record)) continue;
    let value = record[field];

    // Suporta o shape `{ set: value }` de update.
    const isSetWrapper =
      value !== null && typeof value === 'object' && 'set' in (value as object);
    const inner = isSetWrapper ? (value as { set: unknown }).set : value;

    if (inner === undefined) continue;
    const serialized = serializeForEncryption(inner, kind);
    const encrypted = encryptField(serialized as string | null | undefined);

    if (isSetWrapper) {
      record[field] = { set: encrypted };
    } else {
      record[field] = encrypted;
    }
  }
}

function decryptRow(fields: Record<string, EncryptedFieldKind>, row: unknown): void {
  if (!row || typeof row !== 'object') return;
  const record = row as Record<string, unknown>;

  for (const [field, kind] of Object.entries(fields)) {
    if (!(field in record)) continue;
    const stored = record[field];
    if (typeof stored !== 'string') continue;
    const plaintext = decryptField(stored);
    record[field] = deserializeAfterDecryption(plaintext, kind);
  }
}

function decryptResult(fields: Record<string, EncryptedFieldKind>, result: unknown): void {
  if (Array.isArray(result)) {
    for (const row of result) decryptRow(fields, row);
  } else {
    decryptRow(fields, result);
  }
}

export const fieldEncryptionExtension = Prisma.defineExtension({
  name: 'field-encryption',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const key = delegateKey(model);
        if (!key) return query(args);

        const fields = ENCRYPTED_FIELDS[key];
        const a = args as Record<string, unknown>;
        const op: string = operation;

        // Cifra os dados de entrada nas operações de escrita.
        if (op === 'create' || op === 'update') {
          encryptData(fields, a.data);
        } else if (op === 'createMany' || op === 'updateMany') {
          const data = a.data;
          if (Array.isArray(data)) data.forEach((d) => encryptData(fields, d));
          else encryptData(fields, data);
        } else if (op === 'upsert') {
          encryptData(fields, a.create);
          encryptData(fields, a.update);
        }

        const result = await query(args);

        // Decifra a saída nas operações que retornam linha(s) do model.
        decryptResult(fields, result);
        return result;
      },
    },
  },
});
