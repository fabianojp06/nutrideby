# Aditivo Contratual — Inclusão do Telegram como Subprocessador

**Referência**: Aditivo ao "Contrato de Operadora de Dados Pessoais (DPA)" e à "Política de Privacidade e Proteção de Dados NutriDeby - WSS+13" já vigentes (ver `NutriDeby_Compliance_Juridico_LGPD_Analise.md`).

**Motivo**: A partir da Fase 0 do produto, o **Telegram passa a ser o canal principal** de comunicação automatizada com o paciente (lembretes, notificações de plano alimentar, mensagens de boas-vindas), substituindo o WhatsApp Business API nessa posição. Isso exige atualização formal dos instrumentos de LGPD, pois insere um novo subprocessador no fluxo de dados pessoais sensíveis (mensagens trocadas com o paciente, identificador de chat vinculado ao prontuário).

---

## 1. Alteração na Tabela de Subprocessadores (DPA, Cláusula de Subprocessadores)

| Subprocessador | Finalidade | Garantia |
| :--- | :--- | :--- |
| Anthropic, Inc. (Claude API) | Geração de linguagem natural (RAG) | Privacy Policy + Usage Policy (anthropic.com) |
| OpenAI, Inc. / Voyage AI | Embeddings semânticos (pgvector) | Data Processing Agreement do provedor selecionado |
| **Telegram FZ-LLC** | **Entrega de mensagens, lembretes e notificações via Telegram Bot API (canal principal)** | **Telegram Privacy Policy + Bot API Terms (telegram.org)** |
| Meta Platforms (WhatsApp Business API) | Canal de comunicação alternativo/futuro (não utilizado como canal principal na Fase 0) | WhatsApp Business Terms of Service (meta.com) |
| DigitalOcean, LLC | Hospedagem de servidores e banco de dados | Data Processing Agreement (digitalocean.com) |

## 2. Procedimento de Notificação (conforme cláusula já vigente no DPA)
Conforme o DPA original: *"A inclusão de novos subprocessadores será comunicada à Controladora com 15 dias de antecedência, permitindo oposição fundamentada em 10 dias."*

- **Data de notificação às Controladoras (nutricionistas)**: a definir no momento do envio formal deste aditivo.
- **Janela de oposição**: 10 dias corridos a partir da notificação.
- **Canal de notificação**: e-mail cadastrado da nutricionista + aviso no Admin Web.
- Caso não haja oposição fundamentada dentro do prazo, a inclusão do Telegram é considerada aceita tacitamente, conforme cláusula original.

## 3. Dados tratados via Telegram
- Identificador técnico: `chat_id` do Telegram vinculado ao `paciente_id` (não é dado de saúde por si só, mas é dado pessoal de identificação).
- Conteúdo das mensagens automatizadas: lembretes de consulta, notificação de novo plano alimentar disponível, mensagens de boas-vindas.
- **Não são tratados dados clínicos detalhados via Telegram nesta fase** (o conteúdo do prontuário/plano permanece no Admin Web e na PWA — o bot apenas notifica e direciona o paciente a acessar a plataforma).

## 4. Atualização no Termo de Consentimento do Paciente
Incluir, na seção "Como os Dados São Protegidos" / "Para Que os Dados São Usados" do Termo de Consentimento:

> *"Você poderá receber lembretes e notificações da nutricionista via Telegram. Para isso, seu identificador de conta do Telegram (chat_id) será associado ao seu cadastro na Plataforma NutriDeby, exclusivamente para fins de envio dessas comunicações."*

## 5. Atualização na Política de Privacidade
Na seção "Transferência Internacional de Dados", incluir o Telegram FZ-LLC na lista de provedores com dados potencialmente processados fora do Brasil, com base em cláusulas contratuais padrão e na própria política de privacidade do Telegram (Art. 33 da LGPD).

## 6. Status de implementação
- [x] Scaffolding técnico do canal Telegram implementado (`services/telegram-bot`)
- [ ] Aditivo formal revisado e assinado pela WSS+13 (jurídico)
- [ ] Notificação às Controladoras enviada (início da janela de 15 dias)
- [ ] Termo de Consentimento atualizado no fluxo de onboarding do paciente
- [ ] Janela de oposição de 10 dias encerrada sem objeções, ou objeções tratadas

**Este aditivo é uma minuta técnica de apoio — recomenda-se revisão por advogado especializado em LGPD antes de formalização e assinatura.**
