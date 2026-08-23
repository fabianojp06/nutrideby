import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanoAlimentarDto } from './dto/create-plano-alimentar.dto';
import { UpdatePlanoAlimentarDto } from './dto/update-plano-alimentar.dto';

@Injectable()
export class PlanosAlimentaresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(nutricionistaId: string, pacienteId: string, dto: CreatePlanoAlimentarDto) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    return this.prisma.planoAlimentar.create({
      data: { ...dto, refeicoes: dto.refeicoes, pacienteId },
    });
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
    return this.prisma.planoAlimentar.update({
      where: { id },
      data: { ...dto, refeicoes: dto.refeicoes },
    });
  }

  async remove(nutricionistaId: string, pacienteId: string, id: string) {
    await this.findOne(pacienteId, id, nutricionistaId);
    return this.prisma.planoAlimentar.update({ where: { id }, data: { ativo: false } });
  }

  private async assertPacienteDoNutricionista(nutricionistaId: string, pacienteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: pacienteId, nutricionistaId },
    });
    if (!paciente) throw new ForbiddenException('Paciente não pertence a este nutricionista.');
  }
}
