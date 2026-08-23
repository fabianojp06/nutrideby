import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface RegistrarAuditoriaParams {
  ator: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  nutricionistaId?: string | null;
  detalhes?: Prisma.InputJsonValue;
}

// Log de auditoria obrigatório em toda operação sobre dado sensível
// (ver CLAUDE.md — Regras de compliance / US-20). Centralizado aqui para
// evitar reimplementar o mesmo prisma.auditLog.create em cada service —
// era feito só em prontuarios.service.ts antes deste commit.
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(params: RegistrarAuditoriaParams) {
    return this.prisma.auditLog.create({
      data: {
        nutricionistaId: params.nutricionistaId ?? null,
        ator: params.ator,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        detalhes: params.detalhes,
      },
    });
  }
}
