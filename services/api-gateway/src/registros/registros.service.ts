import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateRegistroPesoDto } from './dto/create-registro-peso.dto';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Peso (US-14) ---

  async registrarPeso(pacienteId: string, dto: CreateRegistroPesoDto) {
    const registro = await this.prisma.registroPeso.create({
      data: { pacienteId, pesoKg: dto.pesoKg },
    });

    await this.audit.registrar({
      ator: pacienteId,
      acao: 'PESO_REGISTRADO',
      entidade: 'RegistroPeso',
      entidadeId: registro.id,
    });
    return registro;
  }

  listarPesoDoPaciente(pacienteId: string) {
    return this.prisma.registroPeso.findMany({
      where: { pacienteId },
      orderBy: { registradoEm: 'asc' },
    });
  }

  // Usado pelo Admin Web (US-07: gráfico de evolução) — precisa confirmar
  // que o paciente pertence ao nutricionista autenticado.
  async listarPesoParaNutricionista(nutricionistaId: string, pacienteId: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    return this.listarPesoDoPaciente(pacienteId);
  }

  // --- Diário alimentar (US-13) ---

  async registrarDiario(pacienteId: string, dto: CreateRegistroDiarioDto) {
    if (!dto.texto && !dto.fotoUrl) {
      throw new BadRequestException('Informe ao menos texto ou foto para o registro.');
    }

    const registro = await this.prisma.registroDiario.create({
      data: { pacienteId, texto: dto.texto, fotoUrl: dto.fotoUrl },
    });

    await this.audit.registrar({
      ator: pacienteId,
      acao: 'DIARIO_REGISTRADO',
      entidade: 'RegistroDiario',
      entidadeId: registro.id,
    });
    return registro;
  }

  listarDiarioDoPaciente(pacienteId: string) {
    return this.prisma.registroDiario.findMany({
      where: { pacienteId },
      orderBy: { registradoEm: 'desc' },
    });
  }

  async listarDiarioParaNutricionista(nutricionistaId: string, pacienteId: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    return this.listarDiarioDoPaciente(pacienteId);
  }

  private async assertPacienteDoNutricionista(nutricionistaId: string, pacienteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: pacienteId, nutricionistaId },
    });
    if (!paciente) throw new ForbiddenException('Paciente não pertence a este nutricionista.');
  }
}
