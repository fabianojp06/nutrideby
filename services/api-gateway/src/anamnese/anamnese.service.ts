import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateAnamneseAutodeclaradaDto } from './dto/create-anamnese-autodeclarada.dto';

@Injectable()
export class AnamneseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Contexto PACIENTE (/me/anamnese) ---

  // Cria ou atualiza a anamnese PENDENTE do paciente. Nunca mexe numa já
  // INCORPORADA (essa foi revisada/assinada pela nutri): nesse caso cria uma
  // nova PENDENTE. Assim o paciente pode corrigir o que enviou antes de a
  // nutri revisar, mas não altera o que já virou base do prontuário.
  async enviar(pacienteId: string, dto: CreateAnamneseAutodeclaradaDto) {
    const pendente = await this.prisma.anamneseAutodeclarada.findFirst({
      where: { pacienteId, status: 'PENDENTE_REVISAO' },
      orderBy: { respondidoEm: 'desc' },
    });

    const anamnese = pendente
      ? await this.prisma.anamneseAutodeclarada.update({
          where: { id: pendente.id },
          // peso/altura declarados chegam como number e são cifrados (texto)
          // pela extensão do Prisma junto dos campos free-text.
          data: { ...dto, respondidoEm: new Date() } as unknown as Prisma.AnamneseAutodeclaradaUncheckedUpdateInput,
        })
      : await this.prisma.anamneseAutodeclarada.create({
          data: { ...dto, pacienteId } as unknown as Prisma.AnamneseAutodeclaradaUncheckedCreateInput,
        });

    await this.audit.registrar({
      ator: pacienteId,
      acao: 'ANAMNESE_AUTODECLARADA_ENVIADA',
      entidade: 'AnamneseAutodeclarada',
      entidadeId: anamnese.id,
    });
    return anamnese;
  }

  // Anamnese mais recente do próprio paciente (para a PWA saber se já respondeu).
  buscarMaisRecenteDoPaciente(pacienteId: string) {
    return this.prisma.anamneseAutodeclarada.findFirst({
      where: { pacienteId },
      orderBy: { respondidoEm: 'desc' },
    });
  }

  // --- Contexto NUTRI (/pacientes/:pacienteId/anamnese) ---

  async buscarMaisRecenteParaNutricionista(nutricionistaId: string, pacienteId: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    return this.prisma.anamneseAutodeclarada.findFirst({
      where: { pacienteId },
      orderBy: { respondidoEm: 'desc' },
    });
  }

  // Marca a anamnese como INCORPORADA (nutri "assinou"). NÃO cria o prontuário
  // — a criação do prontuário oficial continua no endpoint próprio; o admin
  // orquestra (editor pré-preenchido → salva prontuário → chama incorporar).
  async incorporar(nutricionistaId: string, pacienteId: string, id: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);

    const anamnese = await this.prisma.anamneseAutodeclarada.findFirst({
      where: { id, pacienteId },
    });
    if (!anamnese) throw new NotFoundException('Anamnese auto-declarada não encontrada.');
    if (anamnese.status === 'INCORPORADA') {
      throw new BadRequestException('Anamnese já incorporada.');
    }

    const atualizada = await this.prisma.anamneseAutodeclarada.update({
      where: { id },
      data: {
        status: 'INCORPORADA',
        incorporadoEm: new Date(),
        incorporadoPorNutriId: nutricionistaId,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'ANAMNESE_INCORPORADA',
      entidade: 'AnamneseAutodeclarada',
      entidadeId: id,
    });
    return atualizada;
  }

  private async assertPacienteDoNutricionista(nutricionistaId: string, pacienteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: pacienteId, nutricionistaId },
    });
    if (!paciente) throw new ForbiddenException('Paciente não pertence a este nutricionista.');
  }
}
