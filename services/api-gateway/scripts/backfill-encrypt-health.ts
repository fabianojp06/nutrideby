/**
 * Backfill de criptografia de campo (item 12) para dado de saúde JÁ existente.
 *
 * Cifra, in place, os valores em texto plano das colunas sensíveis (registry
 * em src/common/crypto/encrypted-fields). Usa um PrismaClient CRU (sem a
 * extensão de cripto) para ler o texto plano e gravar o ciphertext literal.
 * Idempotente: pula valores já cifrados (prefixo enc:v1:), então pode rodar
 * mais de uma vez com segurança.
 *
 * PRÉ-REQUISITOS (ordem importa):
 *   1. As colunas numéricas já devem ter sido migradas de Decimal -> String
 *      no banco (o Postgres converte o valor para texto automaticamente).
 *   2. FIELD_ENCRYPTION_KEY definido (mesma chave que o serviço usará).
 *
 * ⚠️  OPERAÇÃO SENSÍVEL EM DADO DE SAÚDE REAL. Rodar somente contra produção
 *     com OK explícito + BACKUP do banco. Comece com --dry-run.
 *
 * Uso:
 *   DATABASE_URL=... FIELD_ENCRYPTION_KEY=... ts-node scripts/backfill-encrypt-health.ts --dry-run
 *   DATABASE_URL=... FIELD_ENCRYPTION_KEY=... ts-node scripts/backfill-encrypt-health.ts
 */
import { PrismaClient } from '@prisma/client';
import { encryptField, isEncrypted } from '../src/common/crypto/field-crypto';
import { ENCRYPTED_FIELDS } from '../src/common/crypto/encrypted-fields';

const DRY_RUN = process.argv.includes('--dry-run');

// Client CRU (sem extensão) — lê texto plano e grava ciphertext sem que a
// camada de cripto interfira.
const prisma = new PrismaClient();

async function main() {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error('FIELD_ENCRYPTION_KEY ausente.');
  }
  // eslint-disable-next-line no-console
  console.log(`Backfill de cripto de campo — ${DRY_RUN ? 'DRY-RUN (nada será gravado)' : 'GRAVANDO'}`);

  for (const [model, fields] of Object.entries(ENCRYPTED_FIELDS)) {
    const delegate = (prisma as unknown as Record<string, any>)[model];
    if (!delegate) {
      // eslint-disable-next-line no-console
      console.warn(`  ! model ${model} não encontrado no client — pulando`);
      continue;
    }

    const rows: Array<Record<string, unknown>> = await delegate.findMany();
    let cifradosNaTabela = 0;

    for (const row of rows) {
      const data: Record<string, string> = {};
      for (const field of Object.keys(fields)) {
        const value = row[field];
        // Só cifra texto ainda em claro. Valor já cifrado ou nulo é pulado.
        if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
          data[field] = encryptField(value);
        }
      }
      if (Object.keys(data).length === 0) continue;

      cifradosNaTabela += 1;
      if (!DRY_RUN) {
        await delegate.update({ where: { id: row.id }, data });
      }
    }

    // eslint-disable-next-line no-console
    console.log(`  ${model}: ${cifradosNaTabela} registro(s) com campo(s) a cifrar (de ${rows.length}).`);
  }

  // eslint-disable-next-line no-console
  console.log('Concluído.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
