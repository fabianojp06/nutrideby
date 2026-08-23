# NutriDeby — PWA do Paciente

PWA instalável para o paciente (Titular) do NutriDeby, construída com Vite + React + TypeScript + `vite-plugin-pwa`. Layout baseado no mockup aprovado `layout_opcao_2_progresso.html` (dark mode, anel de progresso calórico central).

## Como rodar

Pré-requisito: pnpm instalado (`npm install -g pnpm`).

```bash
pnpm install
pnpm dev
```

A aplicação sobe em `http://localhost:5173`.

Outros comandos:

```bash
pnpm build     # build de produção (tsc + vite build)
pnpm preview   # serve o build de produção localmente
```

## Estrutura

```
src/
  components/   # componentes reutilizáveis (CalorieRing, BottomNav, RouteGuards, AppLayout)
  pages/        # telas: Login, Consent, Home, Diary, Progress, Profile
  hooks/        # useAuth, useConsent (contextos globais)
  services/     # apiClient (fetch base) e mockApi (endpoints mockados)
  styles/       # theme.css com a paleta do mockup aprovado
```

## Fluxo de autenticação e consentimento

1. `/login` — autenticação (mockada em `services/mockApi.ts`, sem integração real ainda).
2. `/consentimento` — tela bloqueante do Termo de Consentimento LGPD. Nenhuma tela com dado de saúde é acessível antes da aceitação explícita (`RequireConsent` em `components/RouteGuards.tsx`).
3. Após aceite: Home, Diário Alimentar, Evolução e Perfil ficam disponíveis, com navegação inferior fixa (`BottomNav`).

## Notas de implementação

- **Diário Alimentar**: registro manual de refeição por texto e/ou foto. Sem análise de IA nesta fase (será integrado ao Agente Clínico RAG em fase futura, sempre com aprovação do nutricionista antes de qualquer output chegar ao paciente).
- **Evolução**: gráfico de peso simples via `<svg><polyline>`, sem dependência de biblioteca de gráficos.
- **PWA**: manifest configurado em `vite.config.ts` (`vite-plugin-pwa`), nome "NutriDeby", `theme_color`/`background_color` = `#0F1A15` (fundo do mockup). Ícones em `public/icons/` são placeholders de 1x1px — substituir por assets reais antes de produção.
- **API**: `services/apiClient.ts` é o cliente HTTP base para o `services/api-gateway` (NestJS). Todos os dados hoje vêm de `services/mockApi.ts`; a troca é isolada nesses dois arquivos.

## Pendências conhecidas

- Substituir `mockApi.ts` pelas chamadas reais ao api-gateway.
- Substituir ícones placeholder por assets de design final.
- Adicionar testes (não incluídos neste scaffolding inicial).
