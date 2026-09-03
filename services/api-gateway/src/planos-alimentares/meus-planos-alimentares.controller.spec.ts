import { MeusPlanosAlimentaresController } from './meus-planos-alimentares.controller';
import { AuthenticatedUser } from '../auth/types/authenticated-user';

// Complemento do gate no nível do controller: as rotas do PACIENTE
// (/me/planos-alimentares) NÃO podem passar um nutricionistaId ao serviço —
// se passassem, o serviço entenderia "contexto nutri" e devolveria rascunhos
// não-aprovados. Este teste trava o contrato do controller: só o sub do
// paciente entra, nunca um segundo argumento que fure o gate.
describe('MeusPlanosAlimentaresController — não fura o gate', () => {
  const paciente = { sub: 'pac-1', role: 'PACIENTE' } as AuthenticatedUser;
  let planosService: {
    findAllByPaciente: jest.Mock;
    findOne: jest.Mock;
  };
  let calculoService: { calcular: jest.Mock };
  let controller: MeusPlanosAlimentaresController;

  beforeEach(() => {
    planosService = {
      findAllByPaciente: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ refeicoes: [] }),
    };
    calculoService = { calcular: jest.fn().mockReturnValue({}) };
    controller = new MeusPlanosAlimentaresController(
      planosService as never,
      calculoService as never,
    );
  });

  it('findAll: chama o serviço só com o sub do paciente (sem nutricionistaId)', () => {
    controller.findAll(paciente);

    expect(planosService.findAllByPaciente).toHaveBeenCalledWith('pac-1');
    // Nenhum segundo argumento — passar um nutricionistaId ativaria o
    // "contexto nutri" e exporia rascunhos.
    expect(planosService.findAllByPaciente.mock.calls[0]).toHaveLength(1);
  });

  it('findOne: chama o serviço só com sub do paciente + id (sem nutricionistaId)', () => {
    controller.findOne(paciente, 'plano-1');

    expect(planosService.findOne).toHaveBeenCalledWith('pac-1', 'plano-1');
    expect(planosService.findOne.mock.calls[0]).toHaveLength(2);
  });

  it('calcular: busca o plano pela ótica do paciente antes de calcular', async () => {
    await controller.calcular(paciente, 'plano-1');

    expect(planosService.findOne).toHaveBeenCalledWith('pac-1', 'plano-1');
    expect(planosService.findOne.mock.calls[0]).toHaveLength(2);
  });
});
