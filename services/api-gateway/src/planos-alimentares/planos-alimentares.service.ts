import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreatePlanoAlimentarDto } from './dto/create-plano-alimentar.dto';
import { UpdatePlanoAlimentarDto } from './dto/update-plano-alimentar.dto';

@Injectable()
export class PlanosAlimentaresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(nutricionistaId: string, pacienteId: string, dto: CreatePlanoAlimentarDto) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    const plano = await this.prisma.planoAlimentar.create({
      data: { ...dto, refeicoes: dto.refeicoes as Prisma.InputJsonValue, pacienteId },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PLANO_ALIMENTAR_CRIADO',
      entidade: 'PlanoAlimentar',
      entidadeId: plano.id,
    });
    return plano;
  }

  async findAllByPaciente(pacienteId: string, nutricionistaId?: string) {
    if (nutricionistaId) {
      await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    }
    return this.prisma.planoAlimentar.findMany({
      where: { pacienteId, ativo: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(pacienteId: string, id: string, nutricionistaId?: string) {
    if (nutricionistaId) {
      await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    }
    const plano = await this.prisma.planoAlimentar.findFirst({ where: { id, pacienteId } });
    if (!plano) throw new NotFoundException('Plano alimentar não encontrado.');
    return plano;
  }

  async update(
    nutricionistaId: string,
    pacienteId: string,
    id: string,
    dto: UpdatePlanoAlimentarDto,
  ) {
    await this.findOne(pacienteId, id, nutricionistaId);
    const plano = await this.prisma.planoAlimentar.update({
      where: { id },
      data: { ...dto, refeicoes: dto.refeicoes as Prisma.InputJsonValue | undefined },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PLANO_ALIMENTAR_ATUALIZADO',
      entidade: 'PlanoAlimentar',
      entidadeId: id,
    });
    return plano;
  }

  async remove(nutricionistaId: string, pacienteId: string, id: string) {
    await this.findOne(pacienteId, id, nutricionistaId);
    const plano = await this.prisma.planoAlimentar.update({ where: { id }, data: { ativo: false } });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PLANO_ALIMENTAR_DESATIVADO',
      entidade: 'PlanoAlimentar',
      entidadeId: id,
    });
    return plano;
  }

  private async assertPacienteDoNutricionista(nutricionistaId: string, pacienteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: pacienteId, nutricionistaId },
    });
    if (!paciente) throw new ForbiddenException('Paciente não pertence a este nutricionista.');
  }
}
