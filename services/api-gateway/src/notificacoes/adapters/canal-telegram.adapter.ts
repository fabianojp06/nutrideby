import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CanalNotificacao,
  LembreteConsultaPayload,
  NovoPlanoPayload,
} from '../canal-notificacao.interface';

/**
 * Adaptador que entrega notificações via HTTP interno do services/telegram-bot.
 *
 * Fala com os endpoints internos do bot (POST /notificacoes/*), autenticando com
 * o header X-Internal-Api-Key (chave compartilhada INTERNAL_API_KEY). A URL base
 * vem de TELEGRAM_BOT_BASE_URL.
 *
 * IMPORTANTE (compliance/DPA): este adaptador só deve ser selecionado
 * (CANAL_NOTIFICACAO=telegram) quando o aditivo de DPA do canal Telegram estiver
 * assinado. Nenhum fluxo do api-gateway chama este adaptador para paciente real
 * ainda — a estrutura fica pronta e testável, inerte por configuração.
 */
@Injectable()
export class CanalNotificacaoTelegram implements CanalNotificacao {
  private readonly logger = new Logger(CanalNotificacaoTelegram.name);

  constructor(private readonly config: ConfigService) {}

  async enviarLembrete(payload: LembreteConsultaPayload): Promise<boolean> {
    return this.postInterno('/notificacoes/lembrete-consulta', {
      pacienteId: payload.pacienteId,
      nutricionistaNome: payload.nutricionistaNome,
      dataHoraConsulta: payload.dataHoraConsulta,
      observacao: payload.observacao,
    });
  }

  async notificarNovoPlano(payload: NovoPlanoPayload): Promise<boolean> {
    return this.postInterno('/notificacoes/novo-plano', {
      pacienteId: payload.pacienteId,
      nutricionistaNome: payload.nutricionistaNome,
      linkPlano: payload.linkPlano,
    });
  }

  private async postInterno(path: string, body: unknown): Promise<boolean> {
    const baseUrl = this.config.get<string>('TELEGRAM_BOT_BASE_URL');
    const apiKey = this.config.get<string>('INTERNAL_API_KEY');

    if (!baseUrl || !apiKey) {
      this.logger.warn(
        `Canal Telegram não configurado (TELEGRAM_BOT_BASE_URL/INTERNAL_API_KEY ausentes); ${path} não enviado.`,
      );
      return false;
    }

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        // Paciente ainda não vinculou conta no canal — não é erro.
        return false;
      }

      if (!response.ok) {
        this.logger.error(
          `telegram-bot POST ${path} falhou (${response.status}).`,
        );
        return false;
      }

      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao comunicar com o telegram-bot em ${path}: ${(erro as Error).message}`,
      );
      return false;
    }
  }
}
