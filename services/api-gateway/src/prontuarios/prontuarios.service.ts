import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

@Injectable()
export class ProntuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(nutricionistaId: string, pacienteId: string, dto: CreateProntuarioDto) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);

    const prontuario = await this.prisma.prontuario.create({
      data: { ...dto, pacienteId },
    });

    await this.registrarAuditoria(nutricionistaId, 'PRONTUARIO_CRIADO', prontuario.id);
    return prontuario;
  }

  async findAllByPaciente(nutricionistaId: string, pacienteId: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    return this.prisma.prontuario.findMany({
      where: { pacienteId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(nutricionistaId: string, pacienteId: string, id: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    const prontuario = await this.prisma.prontuario.findFirst({ where: { id, pacienteId } });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado.');

    await this.registrarAuditoria(nutricionistaId, 'PRONTUARIO_VISUALIZADO', id);
    return prontuario;
  }

  async update(
    nutricionistaId: string,
    pacienteId: string,
    id: string,
    dto: UpdateProntuarioDto,
  ) {
    await this.findOne(nutricionistaId, pacienteId, id);
    const prontuario = await this.prisma.prontuario.update({ where: { id }, data: dto });

    await this.registrarAuditoria(nutricionistaId, 'PRONTUARIO_ATUALIZADO', id);
    return prontuario;
  }

  async remove(nutricionistaId: string, pacienteId: string, id: string) {
    await this.findOne(nutricionistaId, pacienteId, id);
    await this.prisma.prontuario.delete({ where: { id } });

    await this.registrarAuditoria(nutricionistaId, 'PRONTUARIO_EXCLUIDO', id);
    return { id, removido: true };
  }

  private async assertPacienteDoNutricionista(nutricionistaId: string, pacienteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: pacienteId, nutricionistaId },
    });
    if (!paciente) throw new ForbiddenException('Paciente não pertence a este nutricionista.');
  }

  // Log de auditoria obrigatório em toda operação sobre dado de saúde
  // sensível (anamnese/antropometria) — ver CLAUDE.md.
  private registrarAuditoria(nutricionistaId: string, acao: string, entidadeId: string) {
    return this.prisma.auditLog.create({
      data: {
        nutricionistaId,
        ator: nutricionistaId,
        acao,
        entidade: 'Prontuario',
        entidadeId,
      },
    });
  }
}
