import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { PLANOS_COM_ACESSO_RAG } from '../common/planos';
import { CreatePlanoAlimentarDto } from './dto/create-plano-alimentar.dto';
import { UpdatePlanoAlimentarDto } from './dto/update-plano-alimentar.dto';
import { RagAgentService } from './rag-agent.service';

@Injectable()
export class PlanosAlimentaresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ragAgent: RagAgentService,
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

  // Sem nutricionistaId, quem está chamando é o próprio paciente (rotas
  // /me/*) — nesse caso SÓ pode ver planos já aprovados. É a barreira que
  // impede um rascunho de IA (aprovadoPeloNutri=false) de vazar para o
  // paciente antes da revisão do profissional (regra de compliance não
  // negociável, ver CLAUDE.md).
  async findAllByPaciente(pacienteId: string, nutricionistaId?: string) {
    if (nutricionistaId) {
      await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    }
    return this.prisma.planoAlimentar.findMany({
      where: {
        pacienteId,
        ativo: true,
        ...(nutricionistaId ? {} : { aprovadoPeloNutri: true }),
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(pacienteId: string, id: string, nutricionistaId?: string) {
    if (nutricionistaId) {
      await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);
    }
    const plano = await this.prisma.planoAlimentar.findFirst({
      where: {
        id,
        pacienteId,
        ...(nutricionistaId ? {} : { aprovadoPeloNutri: true }),
      },
    });
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

  // Item 20/21/22: gera rascunho via Agente Clínico RAG, gateado por plano
  // (US-08). NÃO persiste como PlanoAlimentar automaticamente — o texto
  // livre gerado pela IA não mapeia 1:1 para a estrutura `refeicoes`
  // (itens com alimentoCodigo/quantidadeGramas da TACO); o nutricionista
  // usa o rascunho como referência para montar/editar o plano estruturado
  // via create()/update() normais, e só então aprova (US-09) — o que já
  // é a única forma de um plano ficar visível ao paciente (ver
  // findAllByPaciente/findOne: aprovadoPeloNutri filtrado nas rotas /me/*).
  async gerarRascunhoIA(nutricionistaId: string, pacienteId: string, perguntaNutricionista: string) {
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteId);

    const assinatura = await this.prisma.assinatura.findUnique({
      where: { nutricionistaId },
      select: { plano: true },
    });
    if (!assinatura || !PLANOS_COM_ACESSO_RAG.includes(assinatura.plano)) {
      throw new ForbiddenException(
        'O Agente Clínico RAG é exclusivo dos planos Pro e Clínica. Faça upgrade para gerar rascunhos por IA.',
      );
    }

    const paciente = await this.prisma.paciente.findUniqueOrThrow({
      where: { id: pacienteId },
      select: { dataNascimento: true, sexoBiologico: true },
    });

    const prontuario = await this.prisma.prontuario.findFirst({
      where: { pacienteId },
      orderBy: { criadoEm: 'desc' },
    });
    if (!prontuario) {
      throw new BadRequestException(
        'Paciente ainda não tem prontuário registrado — registre a anamnese antes de gerar um rascunho por IA.',
      );
    }
    if (!prontuario.pesoKg || !prontuario.alturaCm) {
      throw new BadRequestException(
        'Prontuário sem peso/altura registrados — obrigatórios para o cálculo antropométrico do rascunho.',
      );
    }

    const idade = paciente.dataNascimento ? calcularIdade(paciente.dataNascimento) : 0;

    const rascunho = await this.ragAgent.gerarRascunho({
      pacienteId,
      nutricionistaId,
      dataNascimento: paciente.dataNascimento,
      anamnese: {
        queixa_principal: prontuario.queixaPrincipal ?? undefined,
        historico_clinico: prontuario.historicoClinico ?? undefined,
        medicamentos_uso_continuo: prontuario.usoMedicamentos ? [prontuario.usoMedicamentos] : [],
        alergias_intolerancias: [prontuario.alergias, prontuario.intolerancias]
          .filter((v): v is string => Boolean(v)),
        habitos_alimentares: prontuario.habitosAlimentares ?? undefined,
        nivel_atividade_fisica: prontuario.nivelAtividadeFisica ?? undefined,
        observacoes_adicionais: prontuario.observacoesGerais ?? undefined,
      },
      antropometria: {
        peso_kg: Number(prontuario.pesoKg),
        altura_cm: Number(prontuario.alturaCm),
        idade,
        sexo: mapearSexo(paciente.sexoBiologico),
        circunferencia_cintura_cm: prontuario.circunferenciaCintura
          ? Number(prontuario.circunferenciaCintura)
          : undefined,
        percentual_gordura: prontuario.percentualGordura ? Number(prontuario.percentualGordura) : undefined,
        imc: prontuario.imc ? Number(prontuario.imc) : undefined,
      },
      perguntaNutricionista,
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'RASCUNHO_IA_GERADO',
      entidade: 'Paciente',
      entidadeId: pacienteId,
      detalhes: { modelo: rascunho.modeloUtilizado, fontes: rascunho.fontesUtilizadas.length },
    });

    return rascunho;
  }

  // US-10: duplica um plano para outro paciente (reaproveitar templates).
  // O original não é alterado; a cópia nasce com aprovadoPeloNutri=false —
  // aprovação é por paciente, não pode herdar do plano de origem.
  async duplicar(
    nutricionistaId: string,
    pacienteOrigemId: string,
    id: string,
    pacienteDestinoId: string,
  ) {
    const original = await this.findOne(pacienteOrigemId, id, nutricionistaId);
    await this.assertPacienteDoNutricionista(nutricionistaId, pacienteDestinoId);

    const copia = await this.prisma.planoAlimentar.create({
      data: {
        pacienteId: pacienteDestinoId,
        titulo: original.titulo,
        objetivo: original.objetivo,
        caloriasAlvo: original.caloriasAlvo,
        refeicoes: original.refeicoes as Prisma.InputJsonValue,
        observacoes: original.observacoes,
        aprovadoPeloNutri: false,
      },
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PLANO_ALIMENTAR_DUPLICADO',
      entidade: 'PlanoAlimentar',
      entidadeId: copia.id,
      detalhes: { origemId: id, pacienteOrigemId, pacienteDestinoId },
    });
    return copia;
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

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < dataNascimento.getMonth() ||
    (hoje.getMonth() === dataNascimento.getMonth() && hoje.getDate() < dataNascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

function mapearSexo(sexo: 'MASCULINO' | 'FEMININO' | null): 'masculino' | 'feminino' | 'outro' {
  if (sexo === 'MASCULINO') return 'masculino';
  if (sexo === 'FEMININO') return 'feminino';
  return 'outro';
}
