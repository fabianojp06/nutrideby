import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CANAL_NOTIFICACAO,
  CanalNotificacao,
  LembreteConsultaPayload,
  NovoPlanoPayload,
} from './canal-notificacao.interface';

/**
 * Fachada de notificação ao paciente. Delega para o canal resolvido por
 * configuração (CANAL_NOTIFICACAO). Os consumidores dependem só deste service,
 * nunca de um adaptador concreto.
 *
 * IMPORTANTE (compliance/DPA): por padrão o canal é o inerte (none), então nada é
 * enviado. Nenhum fluxo que atinge paciente real chama este service ainda.
 */
@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    @Inject(CANAL_NOTIFICACAO) private readonly canal: CanalNotificacao,
  ) {}

  async enviarLembreteConsulta(
    payload: LembreteConsultaPayload,
  ): Promise<boolean> {
    return this.canal.enviarLembrete(payload);
  }

  async notificarNovoPlano(payload: NovoPlanoPayload): Promise<boolean> {
    return this.canal.notificarNovoPlano(payload);
  }
}
