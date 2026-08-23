import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusAssinatura } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { AsaasService } from './asaas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';

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

  async create(nutricionistaId: string, dto: CreateAssinaturaDto) {
    const existente = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (existente) throw new ConflictException('Nutricionista já possui assinatura.');

    const trialAte = dto.trialAte
      ? new Date(dto.trialAte)
      : new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000);

    let asaasCustomerId: string | undefined;
    let asaasSubscriptionId: string | undefined;

    // Integração real com a Asaas só roda se ASAAS_API_KEY estiver
    // configurada — em dev/CI sem a chave, a assinatura fica só local em
    // TRIAL (comportamento anterior a este commit), sem quebrar o fluxo.
    if (this.asaas.isConfigured()) {
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
        value: PRECO_POR_PLANO[dto.plano],
        nextDueDate: trialAte.toISOString().slice(0, 10),
        descricao: `NutriDeby — Plano ${dto.plano}`,
      });

      asaasCustomerId = cliente.id;
      asaasSubscriptionId = assinaturaAsaas.id;
    }

    const assinatura = await this.prisma.assinatura.create({
      data: {
        nutricionistaId,
        plano: dto.plano,
        status: 'TRIAL',
        trialAte,
        asaasCustomerId,
        asaasSubscriptionId,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'ASSINATURA_CRIADA',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      detalhes: { plano: dto.plano, asaasSubscriptionId: asaasSubscriptionId ?? null },
    });
    return assinatura;
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

    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: novoStatus },
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

  async findMine(nutricionistaId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada.');
    return assinatura;
  }
}
