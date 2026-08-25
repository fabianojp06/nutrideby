# NutriDeby — Contexto do Projeto

SaaS B2B2C para nutricionistas (Controladora, paga assinatura) e pacientes (Titular, uso gratuito via PWA). Operado pela WSS+13.

## Fase atual: Fase 0 — MVP Vendável
Documentação de referência (`docs/`):
- `docs/produto/backlog_fase0.md` — backlog priorizado por sprint
- `docs/produto/fase0_casos_uso_historias.md` — casos de uso e histórias de usuário com critérios de aceite
- `docs/produto/fase0_estrutura_planos_e_backlog.md` — planos de assinatura (Starter/Pro/Clínica) e DoD
- `docs/arquitetura/arquitetura_tecnica_nutrideby.md` + `arquitetura_agentes_nutrideby.mmd` — arquitetura de referência
- `docs/compliance/NutriDeby_Compliance_Juridico_LGPD_Analise.md` — obrigações de LGPD/DPA vigentes

Demais documentos em `docs/negocio/` (plano de negócio, propostas, concorrência) e `docs/mockups/` (layouts HTML de referência).

## Decisões de stack (Fase 0)
- **Monorepo poliglota, SEM workspace unificado**: cada pacote (`apps/*`, `services/*`) tem seu próprio `package.json` e `package-lock.json`, e é instalado/buildado/deployado de forma independente com **npm** (não há pnpm/turbo; a menção antiga a "pnpm workspaces" era doc drift). O `rag-agent` é Python (FastAPI), fora do ecossistema Node. CI valida por pacote alterado via `dorny/paths-filter` (`.github/workflows/ci.yml`), rodando `npm ci` + build em cada um. Deploys são por-pacote (Railway `--path-as-root` para o api-gateway; Vercel com root = diretório do app) — qualquer adoção futura de workspace precisa reconfigurar esses deploys antes de mesclar.
- **apps/admin-web**: Next.js + TypeScript + Tailwind + shadcn/ui — dashboard do nutricionista
- **apps/pwa-patient**: Vite + React + TypeScript + vite-plugin-pwa — PWA instalável do paciente, layout "Opção 2" (dark, anel de progresso calórico) definido em `docs/mockups/layout_opcao_2_progresso.html`
- **services/api-gateway**: NestJS + TypeScript — gateway/autenticação/roteamento
- **services/rag-agent**: Python + FastAPI — Agente Clínico RAG (LangChain, Postgres+pgvector, Claude API para geração, embeddings)
- **services/telegram-bot**: Node.js + TypeScript (node-telegram-bot-api ou grammY) — canal principal de comunicação (Telegram é o canal principal, não WhatsApp, nesta fase)
- **Banco**: PostgreSQL + extensão pgvector
- **Pagamento**: Asaas (assinatura recorrente Pix/cartão, trial 14 dias sem cartão obrigatório)

## Regras de compliance (não negociáveis)
- Todo dado de saúde: criptografado em repouso (AES-256) e trânsito (TLS 1.2+)
- Nenhuma saída do Agente Clínico RAG pode ser enviada ao paciente sem aprovação explícita do nutricionista
- Todo output de IA clínica deve incluir disclaimer "sugestão para revisão do profissional" (Código de Ética CFN)
- Termo de Consentimento obrigatório antes de qualquer tratamento de dado de saúde do paciente
- Log de auditoria em toda operação sobre dado sensível

## Convenções
- Commits em português, seguindo Conventional Commits (feat:, fix:, chore:)
- Sem comentários desnecessários no código; documentação de "porquê", não de "o quê"
