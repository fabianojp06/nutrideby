import { Injectable, Logger } from '@nestjs/common';
import {
  CanalNotificacao,
  LembreteConsultaPayload,
  NovoPlanoPayload,
} from '../canal-notificacao.interface';

/**
 * Canal inerte: NÃO envia nada. É o padrão do sistema (CANAL_NOTIFICACAO=none)
 * e também o placeholder do futuro canal de e-mail, que só será implementado
 * quando o aditivo de DPA correspondente estiver assinado.
 *
 * Existe para que a estrutura de notificação seja injetável e testável sem
 * disparar comunicação real a pacientes (bloqueio de DPA).
 */
@Injectable()
export class CanalNotificacaoNoop implements CanalNotificacao {
  private readonly logger = new Logger(CanalNotificacaoNoop.name);

  async enviarLembrete(payload: LembreteConsultaPayload): Promise<boolean> {
    this.logger.debug(
      `Canal inerte: lembrete de consulta NÃO enviado (paciente ${payload.pacienteId}).`,
    );
    return false;
  }

  async notificarNovoPlano(payload: NovoPlanoPayload): Promise<boolean> {
    this.logger.debug(
      `Canal inerte: notificação de novo plano NÃO enviada (paciente ${payload.pacienteId}).`,
    );
    return false;
  }
}
