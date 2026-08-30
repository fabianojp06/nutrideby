import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterNutricionistaDto } from './dto/register-nutricionista.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registerNutricionista(dto: RegisterNutricionistaDto) {
    const existente = await this.prisma.nutricionista.findFirst({
      where: { OR: [{ email: dto.email }, { crn: dto.crn }] },
    });
    if (existente) {
      throw new ConflictException('E-mail ou CRN já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS);

    // Trial de 14 dias sem cartão (regra de produto): a nutricionista nasce
    // com uma assinatura TRIAL para poder operar imediatamente (o
    // AssinaturaAtivaGuard exige assinatura em todas as rotas de nutri). A
    // Asaas só entra quando o trial converte em pago — o trial não cria
    // cliente nem cobrança.
    const TRIAL_DIAS = 14;
    const trialAte = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000);

    const nutricionista = await this.prisma.$transaction(async (tx) => {
      const nutri = await tx.nutricionista.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senhaHash,
          crn: dto.crn,
          telefone: dto.telefone,
        },
      });
      await tx.assinatura.create({
        data: {
          nutricionistaId: nutri.id,
          plano: dto.plano ?? 'STARTER',
          status: 'TRIAL',
          trialAte,
        },
      });
      return nutri;
    });

    return this.emitirTokens({
      sub: nutricionista.id,
      email: nutricionista.email,
      role: 'NUTRICIONISTA',
    });
  }

  async login(dto: LoginDto) {
    if (dto.role === 'NUTRICIONISTA') {
      const nutricionista = await this.prisma.nutricionista.findUnique({
        where: { email: dto.email },
      });
      await this.validarSenha(dto.senha, nutricionista?.senhaHash);
      if (!nutricionista) throw new UnauthorizedException('Credenciais inválidas.');

      return this.emitirTokens({
        sub: nutricionista.id,
        email: nutricionista.email,
        role: 'NUTRICIONISTA',
      });
    }

    const paciente = await this.prisma.paciente.findUnique({
      where: { email: dto.email },
    });
    await this.validarSenha(dto.senha, paciente?.senhaHash);
    if (!paciente) throw new UnauthorizedException('Credenciais inválidas.');

    return this.emitirTokens({
      sub: paciente.id,
      email: paciente.email,
      role: 'PACIENTE',
      statusConsentimento: paciente.statusConsentimento,
    });
  }

  private async validarSenha(senha: string, hash?: string | null) {
    const valido = hash ? await bcrypt.compare(senha, hash) : false;
    if (!valido) throw new UnauthorizedException('Credenciais inválidas.');
  }

  private emitirTokens(payload: Record<string, unknown>) {
    return {
      accessToken: this.jwt.sign(payload),
      tokenType: 'Bearer',
    };
  }
}
