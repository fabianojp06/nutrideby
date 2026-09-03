import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CANAL_NOTIFICACAO } from './canal-notificacao.interface';
import { NotificacoesService } from './notificacoes.service';
import { CanalNotificacaoNoop } from './adapters/canal-noop.adapter';
import { CanalNotificacaoTelegram } from './adapters/canal-telegram.adapter';

/**
 * Módulo de notificações. Resolve o canal a partir de CANAL_NOTIFICACAO:
 *   - none (padrão) / email  -> canal inerte (CanalNotificacaoNoop), não envia
 *   - telegram               -> CanalNotificacaoTelegram (HTTP interno do bot)
 *
 * O default `none` respeita o bloqueio de DPA: sem aditivo assinado, nada é
 * enviado a paciente real. O canal `email` ainda é placeholder inerte.
 */
@Module({
  providers: [
    NotificacoesService,
    CanalNotificacaoNoop,
    CanalNotificacaoTelegram,
    {
      provide: CANAL_NOTIFICACAO,
      inject: [
        ConfigService,
        CanalNotificacaoNoop,
        CanalNotificacaoTelegram,
      ],
      useFactory: (
        config: ConfigService,
        noop: CanalNotificacaoNoop,
        telegram: CanalNotificacaoTelegram,
      ) => {
        const canal = (
          config.get<string>('CANAL_NOTIFICACAO') ?? 'none'
        ).toLowerCase();
        switch (canal) {
          case 'telegram':
            return telegram;
          case 'email':
          case 'none':
          default:
            return noop;
        }
      },
    },
  ],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
