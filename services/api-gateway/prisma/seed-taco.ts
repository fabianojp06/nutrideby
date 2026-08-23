import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Importa a Tabela Brasileira de Composição de Alimentos (TACO, 4ª edição,
// NEPA-UNICAMP) para a tabela alimentos_taco. Fonte: prisma/seed-data/taco.json
// (extraído de Taco-4a-Edicao.xlsx, domínio público). Idempotente — roda
// createMany com skipDuplicates, seguro para reexecutar.
//
// Uso: npm run prisma:seed:taco

interface AlimentoTacoRaw {
  codigo: number;
  categoria: string;
  descricao: string;
  umidadePercent: number | null;
  kcal: number | null;
  kj: number | null;
  proteinaG: number | null;
  lipideosG: number | null;
  colesterolMg: number | null;
  carboidratoG: number | null;
  fibraG: number | null;
  cinzasG: number | null;
  calcioMg: number | null;
  magnesioMg: number | null;
  manganesMg: number | null;
  fosforoMg: number | null;
  ferroMg: number | null;
  sodioMg: number | null;
  potassioMg: number | null;
  cobreMg: number | null;
  zincoMg: number | null;
  retinolMcg: number | null;
  reMcg: number | null;
  raeMcg: number | null;
  tiaminaMg: number | null;
  riboflavinaMg: number | null;
  piridoxinaMg: number | null;
  niacinaMg: number | null;
  vitaminaCMg: number | null;
}

const prisma = new PrismaClient();

async function main() {
  const raw = readFileSync(join(__dirname, 'seed-data', 'taco.json'), 'utf-8');
  const alimentos: AlimentoTacoRaw[] = JSON.parse(raw);

  const data: Prisma.AlimentoTacoCreateManyInput[] = alimentos.map((a) => ({
    ...a,
  }));

  const resultado = await prisma.alimentoTaco.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`Importados ${resultado.count} de ${alimentos.length} alimentos da TACO.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
