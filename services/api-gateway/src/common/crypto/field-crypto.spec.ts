import { randomBytes } from 'crypto';
import {
  decryptField,
  encryptField,
  isEncrypted,
  resetFieldCryptoKey,
} from './field-crypto';

describe('field-crypto (AES-256-GCM)', () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    resetFieldCryptoKey();
  });

  afterAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = originalKey;
    resetFieldCryptoKey();
  });

  it('faz round-trip (cifra e decifra de volta ao original)', () => {
    const plaintext = 'Histórico clínico: hipertensão + alergia a lactose';
    const cipher = encryptField(plaintext);
    expect(cipher).not.toBe(plaintext);
    expect(isEncrypted(cipher)).toBe(true);
    expect(decryptField(cipher)).toBe(plaintext);
  });

  it('não vaza o texto plano no valor cifrado', () => {
    const cipher = encryptField('peso 72.5kg');
    expect(cipher).not.toContain('72.5');
    expect(cipher.startsWith('enc:v1:')).toBe(true);
  });

  it('produz ciphertexts distintos para o mesmo texto (IV aleatório)', () => {
    expect(encryptField('mesmo texto')).not.toBe(encryptField('mesmo texto'));
  });

  it('é idempotente: não cifra um valor já cifrado', () => {
    const once = encryptField('alergia a amendoim');
    expect(encryptField(once)).toBe(once);
  });

  it('preserva null e undefined', () => {
    expect(encryptField(null)).toBeNull();
    expect(encryptField(undefined)).toBeUndefined();
    expect(decryptField(null)).toBeNull();
    expect(decryptField(undefined)).toBeUndefined();
  });

  it('tolera valor legado em texto plano ao decifrar (pré-backfill)', () => {
    expect(decryptField('ainda em texto plano')).toBe('ainda em texto plano');
  });

  it('detecta adulteração (auth tag do GCM)', () => {
    const cipher = encryptField('dado íntegro');
    const adulterado = cipher.slice(0, -4) + 'AAAA';
    expect(() => decryptField(adulterado)).toThrow();
  });
});
