import { NotFoundException } from '@nestjs/common';
import { PlanosAlimentaresService } from './planos-alimentares.service';

// GATE DE APROVAÇÃO (regra de compliance NÃO NEGOCIÁVEL, ver CLAUDE.md):
// nenhum plano não-aprovado pode chegar ao paciente. Na prática, isso é a
// barreira das rotas /me/*: quando o serviço é chamado SEM nutricionistaId
// (contexto do próprio paciente), a query TEM que filtrar
// aprovadoPeloNutri=true. Estes testes travam essa barreira — se alguém
// remover o filtro num refactor, o CI quebra antes do merge.
describe('PlanosAlimentaresService — gate de aprovação', () => {
  let service: PlanosAlimentaresService;
  let prisma: {
    planoAlimentar: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    paciente: { findFirst: jest.Mock };
  };
  const audit = { registrar: jest.fn() };
  const ragAgent = { gerarRascunho: jest.fn() };

  beforeEach(() => {
    audit.registrar.mockClear();
    prisma = {
      planoAlimentar: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'plano-1' }),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'novo', ...args.data })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, origem: 'MANUAL', ...args.data })),
      },
      // assertPacienteDoNutricionista: no contexto de nutri, o paciente
      // precisa pertencer a ele. Devolvemos um paciente para não barrar.
      paciente: { findFirst: jest.fn().mockResolvedValue({ id: 'pac-1' }) },
    };
    service = new PlanosAlimentaresService(
      prisma as never,
      audit as never,
      ragAgent as never,
    );
  });

  describe('findAllByPaciente', () => {
    it('CONTEXTO PACIENTE (sem nutricionistaId): força aprovadoPeloNutri=true', async () => {
      await service.findAllByPaciente('pac-1');

      expect(prisma.planoAlimentar.findMany).toHaveBeenCalledTimes(1);
      const where = prisma.planoAlimentar.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        pacienteId: 'pac-1',
        ativo: true,
        aprovadoPeloNutri: true,
      });
    });

    it('CONTEXTO NUTRI (com nutricionistaId): NÃO força aprovadoPeloNutri (nutri vê rascunhos)', async () => {
      await service.findAllByPaciente('pac-1', 'nutri-1');

      const where = prisma.planoAlimentar.findMany.mock.calls[0][0].where;
      // A ausência da chave é o ponto: a nutri enxerga aprovados e pendentes.
      expect(where).not.toHaveProperty('aprovadoPeloNutri');
    });
  });

  // Item 11 / risco confirmado na revisão do PR#45: a aprovação NÃO pode
  // acontecer pelo caminho genérico (create/update). É rota dedicada.
  describe('create — nunca nasce aprovado', () => {
    it('força aprovadoPeloNutri=false na criação', async () => {
      await service.create('nutri-1', 'pac-1', {
        titulo: 'Plano',
        refeicoes: [],
      } as never);

      const data = prisma.planoAlimentar.create.mock.calls[0][0].data;
      expect(data.aprovadoPeloNutri).toBe(false);
    });
  });

  describe('aprovar — único caminho que libera para o paciente', () => {
    it('marca aprovadoPeloNutri=true e audita PLANO_ALIMENTAR_APROVADO', async () => {
      await service.aprovar('nutri-1', 'pac-1', 'plano-1');

      const data = prisma.planoAlimentar.update.mock.calls[0][0].data;
      expect(data).toEqual({ aprovadoPeloNutri: true });
      expect(audit.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'PLANO_ALIMENTAR_APROVADO', entidadeId: 'plano-1' }),
      );
    });
  });

  describe('findOne', () => {
    it('CONTEXTO PACIENTE (sem nutricionistaId): força aprovadoPeloNutri=true', async () => {
      await service.findOne('pac-1', 'plano-1');

      const where = prisma.planoAlimentar.findFirst.mock.calls[0][0].where;
      expect(where).toMatchObject({
        id: 'plano-1',
        pacienteId: 'pac-1',
        aprovadoPeloNutri: true,
      });
    });

    it('CONTEXTO NUTRI (com nutricionistaId): NÃO força aprovadoPeloNutri', async () => {
      await service.findOne('pac-1', 'plano-1', 'nutri-1');

      const where = prisma.planoAlimentar.findFirst.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('aprovadoPeloNutri');
    });

    it('REGRESSÃO: rascunho não-aprovado (findFirst=null) some para o paciente → 404, nunca vaza', async () => {
      // Com o filtro aprovadoPeloNutri=true, um rascunho pendente não casa a
      // query e o Prisma devolve null → o serviço lança NotFound. É a prova
      // de que um plano de IA não-revisado nunca é entregue ao paciente.
      prisma.planoAlimentar.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('pac-1', 'rascunho-ia')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
