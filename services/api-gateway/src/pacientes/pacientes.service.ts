import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  async create(nutricionistaId: string, dto: CreatePacienteDto) {
    const existente = await this.prisma.paciente.findUnique({ where: { email: dto.email } });
    if (existente) throw new ConflictException('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    const { senha: _senha, ...resto } = dto;

    return this.prisma.paciente.create({
      data: {
        ...resto,
        senhaHash,
        nutricionistaId,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
      select: this.selectPublico(),
    });
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
    return this.prisma.paciente.update({
      where: { id },
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
      select: this.selectPublico(),
    });
  }

  async remove(nutricionistaId: string, id: string) {
    await this.findOne(nutricionistaId, id);
    return this.prisma.paciente.update({
      where: { id },
      data: { ativo: false },
      select: this.selectPublico(),
    });
  }

  // Registro do aceite do Termo de Consentimento pelo próprio paciente.
  // Sem isso, ConsentGuard bloqueia acesso a rotas de dado de saúde.
  async aceitarConsentimento(pacienteId: string, dto: AceitarConsentimentoDto) {
    return this.prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        statusConsentimento: 'ACEITO',
        consentimentoVersao: dto.versaoTermo,
        consentimentoAssinadoEm: new Date(),
        consentimentoRevogadoEm: null,
      },
      select: this.selectPublico(),
    });
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
