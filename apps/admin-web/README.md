# NutriDeby — Admin Web

Dashboard do nutricionista (Fase 0 — MVP Vendável). Next.js 14 (App Router) +
TypeScript + Tailwind CSS + shadcn/ui.

## Status

Scaffolding funcional com **dados mockados** (`src/lib/mock-data.ts`), sem
backend conectado ainda. A camada `src/lib/api.ts` centraliza o acesso a
dados — quando `services/api-gateway` estiver disponível, basta trocar as
implementações dessas funções por chamadas HTTP reais, mantendo as mesmas
assinaturas.

## Como rodar

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000` (redireciona para `/login`).

## Scripts

- `pnpm dev` — ambiente de desenvolvimento
- `pnpm build` — build de produção
- `pnpm start` — serve o build de produção
- `pnpm lint` — lint (eslint-config-next)

## Estrutura de pastas

```
src/
  app/
    login/            Login / cadastro do nutricionista (CRN, plano)
    dashboard/         Lista de pacientes
    pacientes/[id]/     Prontuário: anamnese, antropometria, gráfico de evolução
    planos/[id]/        Plano alimentar: refeições, totais de macros, duplicar
    assinatura/         Plano atual (Starter/Pro/Clínica) e histórico de faturas
  components/
    ui/                 Primitivas shadcn/ui (button, card, badge, input, label)
    layout/             Sidebar e AppShell
    patients/           Componentes específicos de paciente (status, gráfico)
    plans/              Componentes específicos de plano alimentar (totais)
  lib/
    api.ts              Camada de acesso a dados (hoje: mock; depois: API real)
    mock-data.ts         Dados estáticos de demonstração
    utils.ts             Helper `cn` (clsx + tailwind-merge)
  types/
    index.ts             Tipos de domínio compartilhados (Paciente, Prontuario,
                          PlanoAlimentar, Fatura, etc.)
```

## Paleta e identidade visual

Verde principal `#2E6B4F` (`brand-500`), consistente com os mockups do
paciente (`layout_opcao_2_progresso.html` na raiz do monorepo). Escala
completa `brand-50` a `brand-900` definida em `tailwind.config.ts`.

## Próximos passos (fora do escopo deste scaffolding)

- Conectar `src/lib/api.ts` ao `services/api-gateway` (NestJS)
- Autenticação real (sessão, confirmação de e-mail — US-01)
- Checkout de pagamento (Asaas) e webhook de confirmação (US-02, US-17)
- Formulários de anamnese/antropometria editáveis com histórico de versões (US-06)
- Fluxo de rascunho de IA (Agente Clínico RAG) com disclaimer obrigatório e
  aprovação explícita antes de envio ao paciente (US-08, US-09)
- Log de auditoria em toda operação sobre dado sensível (US-20)
