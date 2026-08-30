# NutriDeby — Contexto do Projeto

SaaS B2B2C para nutricionistas (Controladora, paga assinatura) e pacientes (Titular, uso gratuito via PWA). Operado pela WSS+13.

## Fase atual: Fase 0 — MVP Vendável

O núcleo já está **em produção**: `services/api-gateway` roda no Railway (Postgres gerenciado, schema aplicado, base TACO com 597 alimentos seedada) e `apps/pwa-patient` (Vercel) consome esse backend real. Já entregues e testados ponta a ponta: cadastro/consentimento/revogação, auditoria, cálculo TACO, duplicação e aprovação de plano, Asaas (assinatura/webhook/faturas), suspensão por inadimplência, limite por plano, diário + peso, e o Agente Clínico RAG real com gate por plano. **Pendências principais**: `apps/admin-web` ainda 100% mockado; `rag-agent` e `telegram-bot` só rodam local (não hospedados); aditivo de DPA do canal de notificação (bloqueio jurídico). Ver backlog priorizado atualizado abaixo.

Documentação de referência (`docs/`):
- `docs/produto/NutriDeby_Backlog_Priorizado.pdf` — **backlog atual** (trabalho restante ranqueado + épicos Fase 1/2). Fonte dos épicos: `docs/produto/fase1_2_epicos_ia_exames_loja.md`.
- `docs/produto/NutriDeby_Plano_Desenvolvimento.pdf` e `NutriDeby_Casos_de_Uso.pdf` — plano e casos de uso com estado real de implementação.
- `docs/produto/backlog_fase0.md`, `fase0_casos_uso_historias.md`, `fase0_estrutura_planos_e_backlog.md` — fontes originais (Fase 0) por sprint, com US e DoD.
- `docs/arquitetura/arquitetura_tecnica_nutrideby.md` + `arquitetura_agentes_nutrideby.mmd` — arquitetura de referência.
- `docs/compliance/NutriDeby_Compliance_Juridico_LGPD_Analise.md` — obrigações de LGPD/DPA vigentes.

Demais documentos em `docs/negocio/` (plano de negócio, propostas, concorrência) e `docs/mockups/` (layouts HTML de referência).

## Decisões de stack (Fase 0)
- **Monorepo poliglota, SEM workspace unificado**: cada pacote (`apps/*`, `services/*`) tem seu próprio `package.json` e `package-lock.json`, e é instalado/buildado/deployado de forma independente com **npm** (não há pnpm/turbo; a menção antiga a "pnpm workspaces" era doc drift). O `rag-agent` é Python (FastAPI), fora do ecossistema Node. CI valida por pacote alterado via `dorny/paths-filter` (`.github/workflows/ci.yml`), rodando `npm ci` + build em cada um. Deploys são por-pacote (Railway `--path-as-root` para o api-gateway; Vercel com root = diretório do app) — **decisão registrada: não converter para workspace**, pois quebraria esses deploys.
- **apps/admin-web** (`@nutrideby/admin-web`): Next.js + TypeScript + Tailwind + shadcn/ui — dashboard do nutricionista. **Ainda mockado** (`src/lib/mock-data.ts`).
- **apps/pwa-patient**: Vite + React + TypeScript + vite-plugin-pwa — PWA instalável do paciente, layout "Opção 2" (dark, anel de progresso calórico) em `docs/mockups/layout_opcao_2_progresso.html`. Camadas: `services/apiClient.ts` (HTTP) + `services/api.ts` (fachada de domínio).
- **services/api-gateway**: NestJS + TypeScript + Prisma — gateway/autenticação/roteamento. Módulos por domínio (`pacientes`, `planos-alimentares`, `prontuarios`, `registros`, `assinaturas`, `alimentos`, `nutricionistas`, `auth`, `common/audit`).
- **services/rag-agent**: Python + FastAPI — Agente Clínico RAG. Usa o **SDK `anthropic` direto** (Claude, sem LangChain/LangGraph) + `voyageai` para embeddings + Postgres/pgvector para recuperação.
- **services/telegram-bot**: Node.js + TypeScript (**grammY**) — canal principal de comunicação (Telegram, não WhatsApp, nesta fase). Bloqueado por aditivo de DPA para uso em produção.
- **Banco**: PostgreSQL + extensão pgvector.
- **Pagamento**: Asaas (assinatura recorrente Pix/cartão, trial 14 dias sem cartão obrigatório).

## Regras de compliance (não negociáveis)
- Todo dado de saúde: criptografado em repouso (AES-256) e trânsito (TLS 1.2+); nunca em URL ou log em texto plano.
- **Nenhuma saída de IA chega ao paciente sem aprovação explícita do nutricionista.** Isso vale para rascunho de plano, texto de resposta, análise de exame e recomendação de produto. "Automático" refere-se à geração do rascunho, **nunca ao envio ao paciente** — recomendação automática direto ao paciente está proibida por design. Rotas de paciente (`/me/*`) filtram `aprovadoPeloNutri=true`.
- Todo output de IA clínica inclui disclaimer "sugestão para revisão do profissional" (Código de Ética CFN).
- Termo de Consentimento obrigatório antes de qualquer tratamento de dado de saúde do paciente.
- Log de auditoria em toda operação sobre dado sensível (`common/audit`).

## Escopo futuro (Fase 1/2)
Formalizado em `docs/produto/fase1_2_epicos_ia_exames_loja.md`: (A) IA analisa exames clínicos e estrutura dados para a nutri (não diagnostica); (B) IA sugere produtos sob aprovação; (C) loja virtual (e-commerce). Fora da Fase 0. Bloqueio transversal: parecer jurídico + CFN + aditivos de DPA (novo dado de saúde sensível + finalidade comercial) — não é decisão de engenharia.

## Time de agentes e skills (`.claude/`)
Skills project-scoped (`.claude/skills/`): `compliance-guard` (regras não-negociáveis como checklist), `railway-admin` (comandos contra o Postgres de produção via tcp-proxy), `nestjs-module` (convenção de módulo do api-gateway), `deploy-nutrideby` (deploy com gate de CI verde).

Subagentes (`.claude/agents/`): `backend-dev` (api-gateway), `frontend-dev` (admin-web + pwa-patient), `dba` (schema/migrations/performance/pgvector), `ai-engineer` (rag-agent e pipeline de IA), `nutri-domain` (regras de negócio de nutrição/CFN — advisory, read-only), `compliance-reviewer` (revisor independente LGPD/segurança). Regra: nenhum agente faz deploy/merge sozinho; mudança sensível passa pelo `compliance-reviewer` antes do merge.

## Convenções
- Commits em português, seguindo Conventional Commits (feat:, fix:, chore:).
- Sem comentários desnecessários no código; documentação de "porquê", não de "o quê".
- Nunca mesclar/deployar sem CI verde. `.claude/settings.local.json` é config de máquina (não versionado).
