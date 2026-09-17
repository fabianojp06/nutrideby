import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Criptografia de campo (application-level) para dado de saúde em repouso —
// AES-256-GCM. Compliance LGPD: além da cripto de disco (Railway) e TLS, os
// campos sensíveis são cifrados ANTES de chegar ao Postgres. A chave (32 bytes)
// vem de FIELD_ENCRYPTION_KEY (base64), guardada como secret no Railway.
//
// Formato armazenado: `enc:v1:<base64(iv | authTag | ciphertext)>`.
// O prefixo versionado permite: (1) detectar valor já cifrado (backfill
// idempotente), (2) evoluir o esquema no futuro, (3) tolerar valor em texto
// plano durante a transição/backfill (decifrar devolve o valor como está).

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // recomendado para GCM
const TAG_BYTES = 16;
const KEY_BYTES = 32; // AES-256

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY ausente: a cripto de campo (dado de saúde) exige uma chave AES-256 de 32 bytes em base64.',
    );
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY inválida: esperado ${KEY_BYTES} bytes (base64), recebido ${key.length}.`,
    );
  }

  cachedKey = key;
  return key;
}

/** Limpa o cache da chave (uso em testes). */
export function resetFieldCryptoKey(): void {
  cachedKey = null;
}

/** Um valor já está cifrado por esta camada? */
export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Cifra um texto. Idempotente: se já estiver cifrado, devolve como está.
 * `null`/`undefined` passam sem alteração (campo opcional continua nulo).
 */
export function encryptField<T extends string | null | undefined>(plaintext: T): T {
  if (plaintext === null || plaintext === undefined) return plaintext;
  if (isEncrypted(plaintext)) return plaintext;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, loadKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const packed = Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  return (PREFIX + packed) as T;
}

/**
 * Decifra um valor. Tolerante: se não estiver no formato cifrado (ex.: dado
 * legado ainda em texto plano antes do backfill), devolve como está.
 * `null`/`undefined` passam sem alteração.
 */
export function decryptField<T extends string | null | undefined>(stored: T): T {
  if (stored === null || stored === undefined) return stored;
  if (!isEncrypted(stored)) return stored;

  const packed = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const iv = packed.subarray(0, IV_BYTES);
  const authTag = packed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = packed.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv(ALGO, loadKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');

  return plaintext as T;
}
