# services/telegram-bot

Canal principal de comunicação com pacientes do NutriDeby (UC-07, US-15/US-16), via Telegram.

> Nota sobre US-16: o backlog (`fase0_casos_uso_historias.md`) registra o uso do Telegram
> como dependente da atualização do DPA/Política de Privacidade (subprocessador). Este
> scaffolding assume que essa decisão de produto já foi validada com o time de compliance
> antes de ir para produção — não altera essa obrigação contratual.

## Stack e decisões

- **Node.js + TypeScript**, bot construído com [grammY](https://grammy.dev).
- **Fastify** para o servidor HTTP interno (gatilhos de notificação).
- **Persistência**: acesso direto via `pg` (sem Prisma próprio) ao mesmo Postgres do
  `services/api-gateway`. Este serviço só é dono de duas tabelas simples
  (`telegram_link_token`, `telegram_vinculo`) definidas em `src/db/schema.sql`, aplicadas
  fora do schema Prisma do api-gateway. Decisão: evitar dois Prisma Clients/migrations
  colidindo sobre o mesmo banco; SQL direto é suficiente para o volume de escrita aqui.
- **Adaptador de Canais**: `src/adapters/ChannelAdapter.ts` define a interface
  (`enviarBoasVindas`, `enviarLembreteConsulta`, `enviarNovoPlanoDisponivel`,
  `enviarMensagemLivre`); `ChannelAdapterTelegram` é a única implementação hoje. Uma futura
  implementação WhatsApp seguiria a mesma interface, permitindo um resolvedor de canal por
  preferência do paciente sem alterar os consumidores (rotas HTTP, scheduler).

## Estrutura

```
src/
  adapters/       Adaptador de Canais (interface + implementação Telegram)
  bot/            Configuração do bot grammY e handlers de comando
  config/         Leitura/validação de variáveis de ambiente
  db/             Pool pg, schema.sql, repositório de vinculação
  http/           Servidor Fastify, auth por chave compartilhada, rotas de notificação
  types/          Tipos compartilhados (payloads de notificação, PacienteId)
  index.ts        Entrypoint: sobe bot (long polling) + servidor HTTP
```

## Rodando localmente

1. `pnpm install` (ou `npm install`) dentro de `services/telegram-bot`.
2. Copie `.env.example` para `.env` e preencha:
   - `TELEGRAM_BOT_TOKEN`: token real obtido via [@BotFather](https://t.me/BotFather).
   - `DATABASE_URL`: mesma instância Postgres do `api-gateway`.
   - `INTERNAL_API_KEY`: chave arbitrária forte, compartilhada com quem for chamar os
     endpoints de notificação (api-gateway ou scheduler).
3. Aplique `src/db/schema.sql` no banco (`psql $DATABASE_URL -f src/db/schema.sql`).
4. `npm run dev` para subir com hot-reload (`tsx watch`).

Sem token/banco reais, o processo falha ao iniciar (validação em `src/config/env.ts`) —
esperado neste scaffolding, que não foi executado nem teve `npm install` rodado.

## Fluxo de vinculação de conta

1. Nutricionista cadastra o paciente no `admin-web` (fluxo já existente no `api-gateway`).
2. O `api-gateway` gera um token de convite de uso único e grava uma linha em
   `telegram_link_token` (paciente_id, token, expira_em) — hoje a tabela é criada por este
   serviço, mas o `api-gateway` é quem escreve o token; a fronteira exata de quem faz o
   `INSERT` é uma decisão de implementação a alinhar quando o endpoint do api-gateway for
   construído. Alternativa igualmente válida: este serviço expor um endpoint interno
   `POST /vinculos/gerar-token` chamado pelo api-gateway — ver TODO abaixo.
3. O admin-web mostra ao paciente/nutricionista um deep link:
   `https://t.me/<NomeDoBot>?start=<token>`.
4. Paciente abre o link no Telegram, o app dispara `/start <token>` para o bot.
5. `src/bot/createBot.ts` valida o token (existe, não expirado, não usado), grava o par
   `chat_id <-> paciente_id` em `telegram_vinculo`, marca o token como usado e responde
   confirmando a vinculação.
6. A partir daí, `ChannelAdapterTelegram` consegue resolver `paciente_id -> chat_id` para
   qualquer envio (lembrete, novo plano, boas-vindas).

**TODO (fora do escopo deste scaffolding):** endpoint no `api-gateway` (ou neste serviço)
para gerar o token de convite a partir do cadastro do paciente. Este serviço já sabe
consumir o token (`vinculoRepository.buscarToken`); falta decidir e implementar quem o cria.

## Endpoints HTTP internos

Autenticados via header `X-Internal-Api-Key: <INTERNAL_API_KEY>` (exceto `/health`).

- `POST /notificacoes/lembrete-consulta`
  ```json
  { "pacienteId": "abc123", "dataHoraConsulta": "2026-08-25T14:00:00-03:00", "nutricionistaNome": "Dra. Deborah", "observacao": "Traga seu diário alimentar" }
  ```
- `POST /notificacoes/novo-plano`
  ```json
  { "pacienteId": "abc123", "nutricionistaNome": "Dra. Deborah", "linkPlano": "https://app.nutrideby.com/planos/456" }
  ```
- `POST /notificacoes/boas-vindas`
  ```json
  { "pacienteId": "abc123", "pacienteNome": "João" }
  ```
- `GET /health` — sem autenticação, para checagem de liveness.

Todas as rotas de notificação retornam `404` se o paciente ainda não vinculou uma conta
no Telegram (nenhuma linha em `telegram_vinculo`), permitindo ao chamador tratar o caso
(ex.: cair para outro canal, ou avisar o nutricionista).

## Compliance (lembrete)

- Nenhuma mensagem de conteúdo clínico gerado por IA (`services/rag-agent`) deve ser
  enviada por este canal sem aprovação explícita do nutricionista.
- Não logar dados de saúde em texto claro; logs do Fastify aqui cobrem apenas
  metadados de requisição HTTP, não o conteúdo de mensagens clínicas.
