---
name: compliance-guard
description: Regras de compliance NÃO-NEGOCIÁVEIS do NutriDeby (LGPD + Código de Ética CFN). Use SEMPRE antes de escrever, revisar ou aprovar qualquer código que toque em dado de saúde do paciente, output do Agente Clínico RAG, planos alimentares, prontuários, consentimento ou log de auditoria. Acione ao mexer em rotas /me/*, PlanosAlimentares, Prontuarios, Registros, ou qualquer coisa que envie conteúdo ao paciente.
---

# Compliance Guard — NutriDeby

Este projeto trata **dado sensível de saúde**. As regras abaixo são não-negociáveis e já custaram um bug real (plano não aprovado vazando para o paciente). Antes de dar por pronta qualquer alteração que toque nos pontos acima, valide item a item.

## 1. Gate de aprovação humana (o mais crítico)

**Nenhuma saída do Agente Clínico RAG — nem qualquer plano alimentar — pode chegar ao paciente sem aprovação explícita do nutricionista.**

- Em toda rota consumida pelo paciente (`/me/*`, sem `nutricionistaId`), filtrar `aprovadoPeloNutri = true`.
- Rascunho de IA é, por definição, `aprovadoPeloNutri = false` até revisão humana.
- Verificação obrigatória ao mexer em `PlanosAlimentaresService.findAllByPaciente` / `findOne` e qualquer novo endpoint `/me`: **a query filtra aprovação?** Se a chamada não tem `nutricionistaId`, é o próprio paciente → filtrar aprovado.
- Regra de teste: escreva/rode um caso que garanta que um plano `aprovadoPeloNutri=false` **não** aparece na resposta de `/me`.

## 2. Disclaimer CFN

Todo output de IA clínica (rascunho de plano, sugestão do RAG) deve carregar o disclaimer **"sugestão para revisão do profissional"** (Código de Ética CFN). Não remover, não esconder no front.

## 3. Consentimento

Termo de Consentimento obrigatório **antes** de qualquer tratamento de dado de saúde do paciente. Nenhum registro (diário, peso, plano) deve ser criado para um paciente sem consentimento ativo. Revogação de consentimento deve ser respeitada em todas as leituras.

## 4. Log de auditoria

**Toda** operação sobre dado sensível gera registro em `AuditLog` (módulo `common/audit`). Ao criar um novo endpoint que lê/escreve dado de saúde, integrar a auditoria — não é opcional. Padrão: reusar o serviço central de auditoria, nunca logar à mão espalhado.

## 5. Criptografia

Dado de saúde: criptografado em repouso (AES-256) e em trânsito (TLS 1.2+). Nunca colocar dado sensível em query string / URL. Nunca logar dado de saúde em texto plano em log de aplicação.

**Cripto de campo (item 12):** a cripto em repouso dos campos sensíveis é aplicada por uma extensão do Prisma (`src/prisma/field-encryption.extension.ts`), com a lista de campos em `src/common/crypto/encrypted-fields.ts`. Regras ao mexer nos models de `ENCRYPTED_FIELDS` (Prontuario, RegistroPeso, RegistroDiario, AnamneseAutodeclarada, PlanoAlimentar):
- **NUNCA** gravar esses campos via `$queryRaw`/`$executeRaw` ou nested write — a extensão só intercepta chamadas via delegate; SQL cru/aninhado grava em texto plano.
- Campo de saúde novo num desses models **precisa** entrar na registry (o teste `encrypted-fields.spec.ts` falha via DMMF se escapar).
- Não trocar `FIELD_ENCRYPTION_KEY` sem plano de re-cifragem — torna ilegível o dado já cifrado.

## 6. Canal de notificação (bloqueio de LGPD, não de código)

O canal ao paciente (Telegram vs. e-mail) está **bloqueado por aditivo de DPA pendente** — novo subprocessador exige notificação às Controladoras (15 dias) + janela de oposição (10 dias) + atualização do Termo. **Não** habilitar envio real a paciente em produção sem essa decisão jurídica fechada. O `telegram-bot` roda só local com dado fictício.

## Checklist rápido (cole no PR / commit quando aplicável)

- [ ] Rota de paciente filtra `aprovadoPeloNutri`?
- [ ] Output de IA carrega disclaimer CFN?
- [ ] Consentimento verificado antes do tratamento?
- [ ] Operação registrada em AuditLog?
- [ ] Nenhum dado de saúde em URL/log em texto plano?
- [ ] Se toca notificação ao paciente: DPA já liberou?
