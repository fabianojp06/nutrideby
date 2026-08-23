import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';

const TRIAL_DIAS = 14;

@Injectable()
export class AssinaturasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Cria a assinatura em TRIAL. A ligação com o Asaas (cobrança recorrente
  // Pix/cartão) é feita em serviço futuro que preenche asaasCustomerId /
  // asaasSubscriptionId via webhook — não implementado neste scaffold.
  async create(nutricionistaId: string, dto: CreateAssinaturaDto) {
    const existente = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (existente) throw new ConflictException('Nutricionista já possui assinatura.');

    const trialAte = dto.trialAte
      ? new Date(dto.trialAte)
      : new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000);

    const assinatura = await this.prisma.assinatura.create({
      data: {
        nutricionistaId,
        plano: dto.plano,
        status: 'TRIAL',
        trialAte,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'ASSINATURA_CRIADA',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      detalhes: { plano: dto.plano },
    });
    return assinatura;
  }

  async findMine(nutricionistaId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { nutricionistaId } });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada.');
    return assinatura;
  }
}
