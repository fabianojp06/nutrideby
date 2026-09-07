import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StatusAssinatura } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { AsaasService } from './asaas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { ConverterParaPagoDto } from './dto/converter-para-pago.dto';
import { AssinaturaDto } from './dto/assinatura.dto';
import { FaturaDto } from './dto/fatura.dto';

const TRIAL_DIAS = 14;

// Preço mensal por plano (docs/produto/fase0_estrutura_planos_e_backlog.md).
const PRECO_POR_PLANO: Record<CreateAssinaturaDto['plano'], number> = {
  STARTER: 49,
  PRO: 129,
  CLINICA: 299,
};

@Injectable()
export class AssinaturasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly asaas: AsaasService,
  ) {}

  async create(nutricionistaId: string, dto: CreateAssinaturaDto): Promise<AssinaturaDto> {
    const existente = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (existente) throw new ConflictException('Nutricionista já possui assinatura.');

    const trialAte = dto.trialAte
      ? new Date(dto.trialAte)
      : new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000);

    // Integração real com a Asaas só roda se ASAAS_API_KEY estiver
    // configurada — em dev/CI sem a chave, a assinatura fica só local em
    // TRIAL (comportamento anterior a este commit), sem quebrar o fluxo.
    const cobranca = this.asaas.isConfigured()
      ? await this.provisionarCobrancaAsaas(nutricionistaId, dto.plano, trialAte)
      : undefined;

    const assinatura = await this.prisma.assinatura.create({
      data: {
        nutricionistaId,
        plano: dto.plano,
        status: 'TRIAL',
        trialAte,
        asaasCustomerId: cobranca?.asaasCustomerId,
        asaasSubscriptionId: cobranca?.asaasSubscriptionId,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'ASSINATURA_CRIADA',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      detalhes: { plano: dto.plano, asaasSubscriptionId: cobranca?.asaasSubscriptionId ?? null },
    });
    return assinatura;
  }

  // Converte uma assinatura em TRIAL (criada no cadastro ou via
  // POST /assinaturas/trial) em um plano PAGO, criando cliente + assinatura
  // recorrente na Asaas. A cobrança só passa a ATIVA quando a Asaas confirma
  // o pagamento (webhook) — aqui a assinatura permanece em TRIAL com os IDs
  // da Asaas vinculados, mesmo padrão do create().
  async converterParaPago(nutricionistaId: string, dto: ConverterParaPagoDto): Promise<AssinaturaDto> {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { nutricionistaId },
    });
    if (!assinatura) {
      throw new NotFoundException(
        'Assinatura não encontrada. Inicie um teste grátis antes de assinar um plano.',
      );
    }
    if (assinatura.status === StatusAssinatura.ATIVA) {
      throw new ConflictException('Assinatura já está ativa.');
    }
    if (assinatura.asaasSubscriptionId) {
      throw new ConflictException(
        'Já existe uma cobrança pendente para esta assinatura. Conclua o pagamento em aberto.',
      );
    }
    if (!this.asaas.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cobrança indisponível: gateway de pagamento não configurado.',
      );
    }

    const trialAte = assinatura.trialAte ?? new Date();
    const cobranca = await this.provisionarCobrancaAsaas(nutricionistaId, dto.plano, trialAte);

    const atualizada = await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        plano: dto.plano,
        asaasCustomerId: cobranca.asaasCustomerId,
        asaasSubscriptionId: cobranca.asaasSubscriptionId,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'ASSINATURA_CONVERTIDA_PAGO',
      entidade: 'Assinatura',
      entidadeId: atualizada.id,
      detalhes: { plano: dto.plano, asaasSubscriptionId: cobranca.asaasSubscriptionId },
    });
    return atualizada;
  }

  // Cria (ou reaproveita) o cliente e a assinatura recorrente na Asaas.
  // Exige cpfCnpj no perfil — sem ele não há como emitir cobrança.
  private async provisionarCobrancaAsaas(
    nutricionistaId: string,
    plano: CreateAssinaturaDto['plano'],
    nextDueDate: Date,
  ): Promise<{ asaasCustomerId: string; asaasSubscriptionId: string }> {
    const nutricionista = await this.prisma.nutricionista.findUniqueOrThrow({
      where: { id: nutricionistaId },
      select: { nome: true, email: true, cpfCnpj: true },
    });

    if (!nutricionista.cpfCnpj) {
      throw new BadRequestException(
        'Complete seu CPF/CNPJ no perfil antes de assinar um plano (obrigatório para cobrança).',
      );
    }

    const cliente = await this.asaas.criarCliente({
      name: nutricionista.nome,
      email: nutricionista.email,
      cpfCnpj: nutricionista.cpfCnpj,
    });

    const assinaturaAsaas = await this.asaas.criarAssinatura({
      customer: cliente.id,
      value: PRECO_POR_PLANO[plano],
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
      descricao: `NutriDeby — Plano ${plano}`,
    });

    return { asaasCustomerId: cliente.id, asaasSubscriptionId: assinaturaAsaas.id };
  }

  // Chamado pelo webhook da Asaas (ver AssinaturasController) quando o
  // status de cobrança muda. Idempotente por natureza: reaplicar o mesmo
  // status não causa efeito colateral.
  async atualizarStatusPorWebhook(asaasSubscriptionId: string, novoStatus: StatusAssinatura) {
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { asaasSubscriptionId },
    });
    if (!assinatura) {
      // Evento de uma assinatura que não conhecemos (ambiente sandbox
      // compartilhado, testes manuais, etc.) — ignora sem erro.
      return;
    }

    // Marca o início da inadimplência só na primeira vez (não reinicia a
    // janela de tolerância se a Asaas reenviar o mesmo evento); limpa ao
    // voltar para ATIVA.
    const inadimplenteDesde =
      novoStatus === StatusAssinatura.INADIMPLENTE
        ? (assinatura.inadimplenteDesde ?? new Date())
        : novoStatus === StatusAssinatura.ATIVA
          ? null
          : assinatura.inadimplenteDesde;

    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: novoStatus, inadimplenteDesde },
    });

    await this.audit.registrar({
      nutricionistaId: assinatura.nutricionistaId,
      ator: 'asaas-webhook',
      acao: 'ASSINATURA_STATUS_ATUALIZADO_WEBHOOK',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      detalhes: { novoStatus, asaasSubscriptionId },
    });
  }

  async findMine(nutricionistaId: string): Promise<AssinaturaDto> {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada.');
    return assinatura;
  }

  // Inicia um teste grátis de 14 dias SEM cartão (self-service), para uma
  // nutricionista que ainda não tem assinatura. Não envolve a Asaas — a
  // cobrança só existe na conversão do trial em plano pago. Espelha o trial
  // criado no cadastro (auth.service), mas exposto como ação para contas
  // que ficaram sem assinatura.
  async iniciarTrial(nutricionistaId: string): Promise<AssinaturaDto> {
    const existente = await this.prisma.assinatura.findUnique({
      where: { nutricionistaId },
    });
    if (existente) {
      throw new ConflictException('Nutricionista já possui assinatura.');
    }
    return this.prisma.assinatura.create({
      data: {
        nutricionistaId,
        plano: 'STARTER',
        status: 'TRIAL',
        trialAte: new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000),
      },
    });
  }

  // US-18: histórico de faturas com status (paga/pendente/falhou) e link
  // do recibo/boleto (hospedado pela própria Asaas). Sem integração
  // configurada ou sem cliente Asaas ainda criado, devolve lista vazia em
  // vez de erro — mesmo padrão de degradação graciosa do create().
  async listarFaturas(nutricionistaId: string): Promise<FaturaDto[]> {
    const assinatura = await this.findMine(nutricionistaId);
    if (!this.asaas.isConfigured() || !assinatura.asaasCustomerId) return [];

    const faturas = await this.asaas.listarFaturas(assinatura.asaasCustomerId);
    return faturas.map((f) => ({
      id: f.id,
      valor: f.value,
      status: mapearStatusFatura(f.status),
      vencimento: f.dueDate,
      pagoEm: f.paymentDate,
      reciboUrl: f.invoiceUrl,
      boletoUrl: f.bankSlipUrl,
    }));
  }
}

// Status de cobrança da Asaas -> rótulo em português usado pelo Admin Web
// (ver critério de aceite de US-18: "status (paga/pendente/falhou)").
function mapearStatusFatura(status: string): 'paga' | 'pendente' | 'falhou' | 'outro' {
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status)) return 'paga';
  if (['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(status)) return 'pendente';
  if (['OVERDUE', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(status)) return 'falhou';
  return 'outro';
}
