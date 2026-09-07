import { BadRequestException } from '@nestjs/common';
import { AnamneseService } from './anamnese.service';

// Item 20 — gate de revisão profissional (espírito igual ao aprovadoPeloNutri):
// o dado auto-declarado nunca escreve no prontuário e uma anamnese já
// INCORPORADA (revisada/assinada pela nutri) não pode ser sobrescrita pelo
// paciente. Estes testes travam essas barreiras.
describe('AnamneseService', () => {
  let service: AnamneseService;
  let prisma: {
    anamneseAutodeclarada: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    paciente: { findFirst: jest.Mock };
  };
  const audit = { registrar: jest.fn() };

  beforeEach(() => {
    audit.registrar.mockClear();
    prisma = {
      anamneseAutodeclarada: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'nova', ...args.data })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      },
      paciente: { findFirst: jest.fn().mockResolvedValue({ id: 'pac-1' }) },
    };
    service = new AnamneseService(prisma as never, audit as never);
  });

  describe('enviar', () => {
    it('atualiza a PENDENTE existente, sem criar outra', async () => {
      prisma.anamneseAutodeclarada.findFirst.mockResolvedValueOnce({ id: 'pend-1', status: 'PENDENTE_REVISAO' });

      await service.enviar('pac-1', { objetivo: 'Emagrecer' } as never);

      expect(prisma.anamneseAutodeclarada.update).toHaveBeenCalledTimes(1);
      expect(prisma.anamneseAutodeclarada.create).not.toHaveBeenCalled();
      expect(audit.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'ANAMNESE_AUTODECLARADA_ENVIADA' }),
      );
    });

    it('NUNCA sobrescreve uma INCORPORADA: cria nova PENDENTE', async () => {
      // findFirst filtra por status PENDENTE_REVISAO → não acha nenhuma
      // (a existente está INCORPORADA) → cria uma nova.
      prisma.anamneseAutodeclarada.findFirst.mockResolvedValueOnce(null);

      await service.enviar('pac-1', { objetivo: 'Ganhar massa' } as never);

      expect(prisma.anamneseAutodeclarada.create).toHaveBeenCalledTimes(1);
      expect(prisma.anamneseAutodeclarada.update).not.toHaveBeenCalled();
    });
  });

  describe('incorporar', () => {
    it('seta status INCORPORADA, marca nutri/data e audita', async () => {
      prisma.anamneseAutodeclarada.findFirst.mockResolvedValueOnce({ id: 'an-1', status: 'PENDENTE_REVISAO' });

      const res = await service.incorporar('nutri-1', 'pac-1', 'an-1');

      expect(res.status).toBe('INCORPORADA');
      expect(res.incorporadoPorNutriId).toBe('nutri-1');
      expect(res.incorporadoEm).toBeInstanceOf(Date);
      expect(audit.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'ANAMNESE_INCORPORADA', entidadeId: 'an-1' }),
      );
    });

    it('é idempotente/erro: já INCORPORADA lança BadRequest', async () => {
      prisma.anamneseAutodeclarada.findFirst.mockResolvedValueOnce({ id: 'an-1', status: 'INCORPORADA' });

      await expect(service.incorporar('nutri-1', 'pac-1', 'an-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.anamneseAutodeclarada.update).not.toHaveBeenCalled();
    });
  });
});
