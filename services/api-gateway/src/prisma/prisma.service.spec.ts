import { PrismaService } from './prisma.service';

// Regressão do padrão `return this.$extends(...)` no construtor do PrismaService
// (item 12). Garante que a instância injetada (o client ESTENDIDO com a cripto
// de campo) ainda expõe os hooks de lifecycle do NestJS e os métodos de conexão
// — se um upgrade do Prisma quebrar esse encaminhamento, o $disconnect gracioso
// no shutdown pararia de rodar silenciosamente. Também confirma que os delegates
// de model (que passam pela cripto) continuam acessíveis.
describe('PrismaService (client estendido com cripto de campo)', () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;
  let prisma: PrismaService;

  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY =
      process.env.FIELD_ENCRYPTION_KEY ?? Buffer.alloc(32, 7).toString('base64');
    prisma = new PrismaService();
  });

  afterAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = originalKey;
  });

  it('preserva os hooks de lifecycle do NestJS após $extends', () => {
    expect(typeof (prisma as unknown as { onModuleInit: unknown }).onModuleInit).toBe('function');
    expect(typeof (prisma as unknown as { onModuleDestroy: unknown }).onModuleDestroy).toBe(
      'function',
    );
  });

  it('preserva $connect/$disconnect (shutdown gracioso)', () => {
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('expõe os delegates de model que passam pela cripto', () => {
    expect((prisma as unknown as { prontuario: unknown }).prontuario).toBeDefined();
    expect((prisma as unknown as { registroPeso: unknown }).registroPeso).toBeDefined();
  });
});
