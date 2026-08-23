# Aditivo Contratual — Inclusão de Provedor de E-mail Transacional como Subprocessador

**Referência**: Aditivo ao "Contrato de Operadora de Dados Pessoais (DPA)" e à "Política de Privacidade e Proteção de Dados NutriDeby - WSS+13" já vigentes (ver `NutriDeby_Compliance_Juridico_LGPD_Analise.md`).

**Status**: opção alternativa ao [`NutriDeby_Aditivo_DPA_Telegram.md`](NutriDeby_Aditivo_DPA_Telegram.md) para o canal principal de notificação/lembrete da Fase 0. **Decisão entre as duas opções ainda em aberto** — ver comparativo no fim deste documento.

**Motivo**: Uso de um provedor de e-mail transacional (ex.: Resend, AWS SES, Postmark, SendGrid) para envio de lembretes de consulta, notificação de novo plano alimentar e mensagens de boas-vindas ao paciente, como alternativa ao Telegram. O e-mail do paciente já é um dado cadastral coletado no onboarding (US-03) — a mudança é de *finalidade de uso*, não de coleta de um novo identificador.

---

## 1. Alteração na Tabela de Subprocessadores (DPA, Cláusula de Subprocessadores)

| Subprocessador | Finalidade | Garantia |
| :--- | :--- | :--- |
| Anthropic, Inc. (Claude API) | Geração de linguagem natural (RAG) | Privacy Policy + Usage Policy (anthropic.com) |
| OpenAI, Inc. / Voyage AI | Embeddings semânticos (pgvector) | Data Processing Agreement do provedor selecionado |
| **[Provedor a definir — Resend / AWS SES / Postmark]** | **Entrega de e-mails transacionais (lembretes, notificações, canal principal)** | **Data Processing Agreement do provedor selecionado — padrão de mercado, SOC 2** |
| Meta Platforms (WhatsApp Business API) | Canal de comunicação alternativo/futuro (não utilizado como canal principal na Fase 0) | WhatsApp Business Terms of Service (meta.com) |
| DigitalOcean, LLC | Hospedagem de servidores e banco de dados | Data Processing Agreement (digitalocean.com) |

## 2. Procedimento de Notificação (conforme cláusula já vigente no DPA)
Conforme o DPA original: *"A inclusão de novos subprocessadores será comunicada à Controladora com 15 dias de antecedência, permitindo oposição fundamentada em 10 dias."*

- **Data de notificação às Controladoras (nutricionistas)**: a definir no momento do envio formal deste aditivo.
- **Janela de oposição**: 10 dias corridos a partir da notificação.
- **Canal de notificação**: e-mail cadastrado da nutricionista + aviso no Admin Web.
- Caso não haja oposição fundamentada dentro do prazo, a inclusão é considerada aceita tacitamente, conforme cláusula original.

## 3. Dados tratados via e-mail
- Endereço de e-mail do paciente — já coletado como dado cadastral no cadastro (US-03), sem novo identificador técnico associado (diferente do `chat_id` do Telegram).
- Conteúdo das mensagens automatizadas: lembretes de consulta, notificação de novo plano alimentar disponível, mensagens de boas-vindas.
- **Não são tratados dados clínicos detalhados via e-mail nesta fase** — o corpo do e-mail apenas notifica e direciona o paciente a acessar a Plataforma; o conteúdo do prontuário/plano permanece no Admin Web e na PWA.

## 4. Atualização no Termo de Consentimento do Paciente
Incluir, na seção "Como os Dados São Protegidos" / "Para Que os Dados São Usados" do Termo de Consentimento:

> *"Você poderá receber lembretes e notificações da nutricionista por e-mail, no endereço informado no seu cadastro."*

## 5. Atualização na Política de Privacidade
Na seção "Transferência Internacional de Dados", incluir o provedor de e-mail selecionado na lista de subprocessadores, com base em cláusulas contratuais padrão e na política de privacidade do provedor.

## 6. Status de implementação
- [ ] Escolha do provedor de e-mail transacional (Resend / AWS SES / Postmark / SendGrid)
- [ ] Scaffolding técnico do canal de e-mail — **não implementado** (hoje só existe `services/telegram-bot`)
- [ ] Aditivo formal revisado e assinado pela WSS+13 (jurídico)
- [ ] Notificação às Controladoras enviada (início da janela de 15 dias)
- [ ] Termo de Consentimento atualizado no fluxo de onboarding do paciente
- [ ] Janela de oposição de 10 dias encerrada sem objeções, ou objeções tratadas

**Este aditivo é uma minuta técnica de apoio — recomenda-se revisão por advogado especializado em LGPD antes de formalização e assinatura.**

---

## Comparativo — Telegram vs. E-mail como canal principal

| Critério | Telegram | E-mail |
|---|---|---|
| Novo identificador técnico exigido | Sim (`chat_id`, vínculo extra no onboarding) | Não (e-mail já coletado em US-03) |
| Jurisdição do subprocessador | Telegram FZ-LLC (Dubai) — mais difícil de embasar "garantias equivalentes" | Provedores com DPA/SOC2 padrão de mercado (mesmo perfil de Anthropic/OpenAI já aceitos) |
| Complexidade técnica | Bot + webhook + Adaptador de Canais (`services/telegram-bot` já implementado) | Chamada de API transacional simples, sem serviço dedicado |
| Taxa de engajamento esperada | Alta (mensagem instantânea) | Mais baixa (e-mail é lido com menos frequência/urgência) |
| Código hoje | Implementado, aguardando aditivo | Não implementado |

**Decisão pendente** — registrada também em `docs/produto/fase0_casos_uso_historias.md` (seção "Em aberto para validação com o cliente/stakeholder").
