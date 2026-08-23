import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { AceitarConsentimentoDto } from './dto/aceitar-consentimento.dto';

const SALT_ROUNDS = 12;
const LINK_TOKEN_TTL_HORAS = 48;

@Injectable()
export class PacientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async create(nutricionistaId: string, dto: CreatePacienteDto) {
    const existente = await this.prisma.paciente.findUnique({ where: { email: dto.email } });
    if (existente) throw new ConflictException('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    const { senha: _senha, ...resto } = dto;

    const paciente = await this.prisma.paciente.create({
      data: {
        ...resto,
        senhaHash,
        nutricionistaId,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
      select: this.selectPublico(),
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PACIENTE_CRIADO',
      entidade: 'Paciente',
      entidadeId: paciente.id,
    });
    return paciente;
  }

  findAllByNutricionista(nutricionistaId: string) {
    return this.prisma.paciente.findMany({
      where: { nutricionistaId },
      select: this.selectPublico(),
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(nutricionistaId: string, id: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id, nutricionistaId },
      select: this.selectPublico(),
    });
    if (!paciente) throw new NotFoundException('Paciente não encontrado.');
    return paciente;
  }

  async update(nutricionistaId: string, id: string, dto: UpdatePacienteDto) {
    await this.findOne(nutricionistaId, id);
    const paciente = await this.prisma.paciente.update({
      where: { id },
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
      select: this.selectPublico(),
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PACIENTE_ATUALIZADO',
      entidade: 'Paciente',
      entidadeId: id,
    });
    return paciente;
  }

  async remove(nutricionistaId: string, id: string) {
    await this.findOne(nutricionistaId, id);
    const paciente = await this.prisma.paciente.update({
      where: { id },
      data: { ativo: false },
      select: this.selectPublico(),
    });

    await this.audit.registrar({
      nutricionistaId,
      ator: nutricionistaId,
      acao: 'PACIENTE_DESATIVADO',
      entidade: 'Paciente',
      entidadeId: id,
    });
    return paciente;
  }

  // Registro do aceite do Termo de Consentimento pelo próprio paciente.
  // Sem isso, ConsentGuard bloqueia acesso a rotas de dado de saúde.
  async aceitarConsentimento(pacienteId: string, dto: AceitarConsentimentoDto) {
    const antes = await this.prisma.paciente.findUniqueOrThrow({
      where: { id: pacienteId },
      select: { nutricionistaId: true },
    });

    const paciente = await this.prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        statusConsentimento: 'ACEITO',
        consentimentoVersao: dto.versaoTermo,
        consentimentoAssinadoEm: new Date(),
        consentimentoRevogadoEm: null,
      },
      select: this.selectPublico(),
    });

    await this.audit.registrar({
      nutricionistaId: antes.nutricionistaId,
      ator: pacienteId,
      acao: 'CONSENTIMENTO_ACEITO',
      entidade: 'Paciente',
      entidadeId: pacienteId,
    });
    return paciente;
  }

  // US-05: paciente pode revogar o consentimento a qualquer momento (LGPD,
  // direito do titular). A partir daqui o ConsentGuard volta a bloquear as
  // rotas de dado de saúde deste paciente.
  //
  // NOTA: o critério de aceite de US-05 também exige notificar a
  // nutricionista em até 5 dias úteis e marcar os dados para exclusão
  // conforme prazo de retenção — nenhum dos dois está implementado aqui
  // (exigem, respectivamente, um canal de notificação e uma política de
  // retenção/expurgo ainda não definidos). Este método cobre só o registro
  // da revogação e o efeito imediato de bloqueio de acesso.
  async revogarConsentimento(pacienteId: string) {
    const antes = await this.prisma.paciente.findUniqueOrThrow({
      where: { id: pacienteId },
      select: { nutricionistaId: true },
    });

    const paciente = await this.prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        statusConsentimento: 'REVOGADO',
        consentimentoRevogadoEm: new Date(),
      },
      select: this.selectPublico(),
    });

    await this.audit.registrar({
      nutricionistaId: antes.nutricionistaId,
      ator: pacienteId,
      acao: 'CONSENTIMENTO_REVOGADO',
      entidade: 'Paciente',
      entidadeId: pacienteId,
    });

    return paciente;
  }

  // Gera o token de convite de vínculo com o bot de Telegram (tabela
  // `telegram_link_token`, de propriedade do services/telegram-bot — ver
  // decisão em services/telegram-bot/README.md de manter essas tabelas fora
  // do schema Prisma deste serviço, por isso o SQL direto em vez de model).
  async gerarLinkTelegram(nutricionistaId: string, pacienteId: string) {
    await this.findOne(nutricionistaId, pacienteId);

    const token = randomBytes(24).toString('hex');
    const expiraEm = new Date(Date.now() + LINK_TOKEN_TTL_HORAS * 60 * 60 * 1000);

    await this.prisma.$executeRaw`
      INSERT INTO telegram_link_token (token, paciente_id, expira_em)
      VALUES (${token}, ${pacienteId}, ${expiraEm})
    `;

    const botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME', 'NutriBebyBot');
    return {
      token,
      expiraEm,
      deepLink: `https://t.me/${botUsername}?start=${token}`,
    };
  }

  private selectPublico() {
    return {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      dataNascimento: true,
      sexoBiologico: true,
      statusConsentimento: true,
      consentimentoVersao: true,
      consentimentoAssinadoEm: true,
      ativo: true,
      criadoEm: true,
    } as const;
  }
}
