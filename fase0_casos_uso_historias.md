# NutriDeby — Fase 0 (MVP Vendável): Casos de Uso e Histórias de Usuário

Escopo da Fase 0, conforme plano de desenvolvimento acordado:
Admin Web (nutricionista) · PWA Paciente · Cálculo nutricional · Cobrança recorrente · LGPD mínimo · Agente Clínico RAG simples · Telegram Bot (pendente ajuste de compliance) · WhatsApp Business API

Atores: **Nutricionista** (Controladora), **Paciente** (Titular), **Sistema/Agente RAG**, **WSS+13** (Operadora).

---

## 1. Onboarding e Contas

### UC-01 — Cadastro do Nutricionista
Nutricionista cria conta no Admin Web, informa dados profissionais (CRN, CPF/CNPJ) e escolhe plano de assinatura.

**Histórias:**
- **US-01**: Como nutricionista, quero criar minha conta com CRN e dados de faturamento, para começar a usar a plataforma.
  - Critérios de aceite: valida CRN em formato correto; e-mail confirmado antes de liberar acesso; dados de faturamento salvos criptografados.
- **US-02**: Como nutricionista, quero escolher um plano de assinatura no cadastro, para iniciar a cobrança recorrente.
  - Critérios de aceite: exibe planos disponíveis com preço; redireciona para checkout de pagamento; conta fica em "pendente" até confirmação do pagamento.

### UC-02 — Cadastro e Consentimento do Paciente
Nutricionista cadastra paciente; paciente recebe convite e assina o Termo de Consentimento antes de qualquer dado de saúde ser tratado.

**Histórias:**
- **US-03**: Como nutricionista, quero cadastrar um novo paciente com dados básicos, para iniciar o atendimento.
  - Critérios de aceite: campos obrigatórios (nome, data de nascimento, telefone, e-mail); paciente criado em status "aguardando consentimento".
- **US-04**: Como paciente, quero receber um convite e ler o Termo de Consentimento antes de acessar a plataforma, para saber como meus dados de saúde serão usados (LGPD Art. 11, I).
  - Critérios de aceite: acesso à PWA bloqueado até assinatura eletrônica do termo; timestamp e versão do termo assinado ficam registrados; paciente pode baixar cópia do termo.
- **US-05**: Como paciente, quero poder revogar meu consentimento a qualquer momento, para exercer meu direito da LGPD.
  - Critérios de aceite: opção visível em "Configurações"; revogação notifica nutricionista em até 5 dias úteis conforme DPA; dados marcados para exclusão conforme prazo de retenção.

---

## 2. Prontuário e Plano Alimentar (Admin Web)

### UC-03 — Registro de Prontuário
Nutricionista registra anamnese, dados antropométricos e histórico clínico do paciente.

**Histórias:**
- **US-06**: Como nutricionista, quero registrar anamnese e dados antropométricos do paciente, para embasar o plano alimentar.
  - Critérios de aceite: formulário estruturado (peso, altura, IMC calculado automaticamente, histórico alimentar); histórico de versões do prontuário mantido (auditoria).
- **US-07**: Como nutricionista, quero visualizar a evolução antropométrica do paciente em gráfico, para acompanhar o progresso.
  - Critérios de aceite: gráfico de peso/IMC ao longo do tempo; dados vêm de múltiplos registros de consulta.

### UC-04 — Geração de Plano Alimentar (com apoio de IA)
Nutricionista solicita rascunho de plano alimentar ao Agente Clínico RAG, revisa e edita antes de liberar ao paciente.

**Histórias:**
- **US-08**: Como nutricionista, quero solicitar um rascunho de plano alimentar gerado por IA a partir do prontuário do paciente, para agilizar meu trabalho.
  - Critérios de aceite: IA consome prontuário + base nutricional (TACO/TBCA); resposta inclui aviso obrigatório "sugestão para revisão do profissional" (conformidade CFN); tempo de resposta < 15s.
- **US-09**: Como nutricionista, quero editar e aprovar o rascunho gerado pela IA antes de enviar ao paciente, para manter a responsabilidade clínica final comigo.
  - Critérios de aceite: plano só é visível ao paciente após ação explícita de "Aprovar e Enviar"; toda edição do nutricionista é registrada (log de auditoria).
- **US-10**: Como nutricionista, quero duplicar um plano alimentar existente para outro paciente, para reaproveitar templates.
  - Critérios de aceite: cópia gera novo registro vinculado ao novo paciente, sem alterar o original.
- **US-11**: Como nutricionista, quero que o cálculo nutricional do plano use valores oficiais (TACO/TBCA), para garantir precisão.
  - Critérios de aceite: cada item do plano exibe fonte da tabela nutricional; totais de macro/micronutrientes calculados automaticamente.

---

## 3. Experiência do Paciente (PWA)

### UC-05 — Acesso ao Plano Alimentar
- **US-12**: Como paciente, quero acessar meu plano alimentar pela PWA no navegador do celular, para consultar minhas refeições sem instalar app.
  - Critérios de aceite: PWA instalável (ícone na tela inicial); funciona offline para visualização do último plano sincronizado.

### UC-06 — Diário Alimentar Simples
- **US-13**: Como paciente, quero registrar minhas refeições por texto ou foto no diário alimentar, para acompanhar minha alimentação.
  - Critérios de aceite: registro com data/hora automática; foto opcional sem análise por IA nesta fase; nutricionista visualiza o diário no Admin Web.
- **US-14**: Como paciente, quero registrar meu peso periodicamente, para acompanhar minha evolução.
  - Critérios de aceite: histórico de peso alimenta o gráfico de evolução (US-07).

---

## 4. Comunicação (WhatsApp / Telegram)

### UC-07 — Notificações e Lembretes
- **US-15**: Como paciente, quero receber lembretes de consulta e mensagens da nutricionista via WhatsApp, para não perder compromissos.
  - Critérios de aceite: envio via WhatsApp Business API (subprocessador Meta já homologado no DPA); opt-in obrigatório no consentimento.
- **US-16**: Como paciente, quero poder optar por receber notificações via Telegram como alternativa ao WhatsApp, para usar o canal de minha preferência.
  - Critérios de aceite: **bloqueado até atualização do DPA/Política de Privacidade incluindo Telegram como subprocessador** (aviso de 15 dias + direito de oposição da Controladora); mensagens roteadas pelo Adaptador de Canais.

---

## 5. Cobrança (Monetização)

### UC-08 — Assinatura Recorrente
- **US-17**: Como nutricionista, quero pagar minha assinatura via Pix ou cartão de crédito recorrente, para manter acesso à plataforma.
  - Critérios de aceite: integração com gateway (Stripe/Pix); renovação automática mensal; falha de pagamento suspende acesso após período de tolerância (ex.: 3 dias) com aviso prévio.
- **US-18**: Como nutricionista, quero visualizar meu histórico de faturas, para controle financeiro do meu consultório.
  - Critérios de aceite: lista de faturas com status (paga/pendente/falhou); download de recibo em PDF.

---

## 6. Segurança e Compliance (transversal, não negociável)

### UC-09 — Proteção de Dados de Saúde
- **US-19**: Como Operadora (WSS+13), preciso que todos os dados de saúde sejam criptografados em repouso (AES-256) e em trânsito (TLS 1.2+), para cumprir a LGPD e o DPA vigente.
  - Critérios de aceite: verificação automatizada em pipeline de CI antes de deploy; nenhum dado sensível em logs de aplicação.
- **US-20**: Como Controladora (nutricionista), preciso que toda operação sobre dados sensíveis gere log de auditoria, para responder a fiscalizações da ANPD.
  - Critérios de aceite: logs incluem quem, o quê, quando; retenção mínima conforme política vigente.

---

## Notas de Priorização dentro da Fase 0

| Prioridade | Itens |
|---|---|
| **P0 — bloqueia lançamento** | US-01 a US-11, US-17, US-19, US-20 |
| **P0.5 — lança com, mas pode ser simplificado** | US-12 a US-15 |
| **Bloqueado por dependência externa** | US-16 (Telegram — aguarda atualização contratual do DPA) |

## Em aberto para validação com o cliente/stakeholder
1. Gateway de pagamento definitivo (Stripe vs. Pix direto vs. ambos)?
2. Telegram entra como substituto do WhatsApp ou canal adicional?
3. Estrutura de planos de assinatura (valores, limites por número de pacientes)?
