# NutriDeby — Épicos de Expansão (Fase 1/2): Exames, Recomendação e Loja Virtual

Escopo **novo**, fora da Fase 0. Formaliza a demanda de: IA que analisa exames clínicos enviados pelo paciente e sugere produtos de uma loja virtual (página dentro do site). Registrado em 29/08/2026.

> **Princípio inegociável reafirmado:** nenhuma saída de IA — texto, análise de exame ou recomendação de produto — chega ao paciente sem **aprovação explícita da nutricionista**. A palavra "automático" descrita na demanda original refere-se à *geração do rascunho*, nunca ao *envio ao paciente*. Recomendação automática direto ao paciente está **proibida** por design.

Pré-requisito transversal (bloqueia os três épicos em produção): **parecer jurídico + CFN + aditivos de DPA/consentimento** para (a) tratar exame laboratorial como novo dado de saúde sensível e (b) usar dado de saúde com finalidade comercial. Não é decisão de engenharia.

---

## Épico A — Análise de Exames Clínicos (apoio à nutricionista)

**Objetivo:** paciente envia exame; a IA **estrutura e destaca** os dados para a nutri revisar. A IA **não diagnostica** — a interpretação clínica permanece humana.

**Design com gate embutido:**
- Upload de exame (PDF/imagem) pelo paciente na PWA → armazenado como dado de saúde sensível (AES-256, auditoria).
- IA extrai/organiza valores (ex.: destaca marcadores fora da referência) e produz um **resumo-rascunho** com disclaimer CFN "sugestão para revisão do profissional".
- O rascunho vai **para a fila de aprovação da nutri**, nunca ao paciente. Interpretação e conduta são da profissional.
- Extrapolação de escopo: interpretar exame pode tangenciar ato médico — a IA se limita a *estruturar dados*, não a concluir diagnóstico.

**Histórias:**
- **US-E1** — Como paciente, quero enviar meu exame pela PWA, para que minha nutricionista o avalie. *Aceite:* upload aceita PDF/imagem; consentimento específico para exames exigido antes do 1º envio; arquivo criptografado; registro em auditoria.
- **US-E2** — Como nutricionista, quero que a IA estruture os dados do exame para eu revisar, para agilizar minha análise. *Aceite:* saída marcada como rascunho + disclaimer CFN; nenhuma conclusão exibida ao paciente; toda geração e edição auditadas.
- **US-E3** — Como Operadora, preciso que o processamento de exames tenha base legal própria (LGPD, finalidade específica). *Aceite:* consentimento específico versionado; aditivo de DPA vigente antes de habilitar em produção.

---

## Épico B — Motor de Recomendação de Produtos (sob aprovação)

**Objetivo:** a partir do prontuário/exame, a IA **sugere** produtos da loja como **rascunho** para a nutri. Depende do Épico A (exames) e do Épico C (catálogo).

**Design com gate embutido:**
- IA gera lista de produtos sugeridos vinculada ao paciente → entra na **mesma fila de aprovação** (tabela central) do plano alimentar.
- Só após ação explícita de "Aprovar e Enviar" o paciente vê a recomendação. **Push automático ao paciente é proibido.**
- Cada recomendação carrega disclaimer CFN e é auditada.
- **Conflito de interesse:** se a nutri/operadora recebe comissão, a recomendação deve declarar isso; regra do CFN sobre venda de produtos deve ser revista no parecer.

**Histórias:**
- **US-E4** — Como nutricionista, quero receber sugestões de produtos geradas pela IA para revisar antes de enviar, para manter a responsabilidade clínica e comercial comigo. *Aceite:* sugestão entra na fila de aprovação; editável; nada visível ao paciente sem aprovação.
- **US-E5** — Como paciente, quero ver apenas recomendações aprovadas pela minha nutricionista, para confiar na indicação. *Aceite:* paciente só enxerga itens com `aprovadoPeloNutri=true`; disclaimer visível.
- **US-E6** — Como Operadora, preciso registrar a base da recomendação e eventual comissão, para transparência e conformidade. *Aceite:* auditoria da origem da sugestão; declaração de conflito de interesse quando houver comissão.

---

## Épico C — Loja Virtual (e-commerce)

**Objetivo:** página de loja dentro do site: catálogo, carrinho, checkout, pedidos. Fundação independente que os Épicos A/B consomem.

**Design:**
- Novos models: `Produto`, `Categoria`, `Pedido`, `ItemPedido` (e `Estoque` se necessário).
- Pagamento reaproveita a integração **Asaas** já existente.
- Multi-tenant desde o início (produtos por nutricionista/clínica, ou catálogo central + curadoria).
- A recomendação do Épico B referencia produtos deste catálogo; sem catálogo, não há o que recomendar.

**Histórias:**
- **US-E7** — Como paciente, quero navegar e comprar produtos na loja, para adquirir o que foi indicado. *Aceite:* catálogo com preço/estoque; checkout via Asaas; recibo.
- **US-E8** — Como nutricionista, quero gerenciar o catálogo (produtos, preços, disponibilidade), para curar o que ofereço. *Aceite:* CRUD de produto com controle por tenant.
- **US-E9** — Como nutricionista, quero relatório de vendas/comissão, para acompanhar o resultado. *Aceite:* consolidado por período; separação de comissão quando aplicável.

---

## Priorização sugerida (dentro da Fase 1/2)

Pré-requisito: **parecer jurídico/CFN + DPA** (bloqueia produção dos três).

1. **Épico C — Loja Virtual** (fundação; independente; reusa Asaas).
2. **Épico A — Análise de Exames** (fundação; independente; exige DPA/consentimento de exame).
3. **Épico B — Recomendação sob aprovação** (depende de A + C; é onde o gate de aprovação é mais crítico).

Nada disso entra na Fase 0, cujo foco continua sendo fechar a Definition of Done atual (ver `NutriDeby_Backlog_Priorizado.pdf`).
