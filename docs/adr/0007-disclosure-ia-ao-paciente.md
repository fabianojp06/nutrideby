# ADR-0007 — Disclosure de IA ao paciente na PWA

- **Status:** Aceito (pendente confirmação de parecer jurídico/CFN)
- **Data:** 2026-09-03
- **Decisores:** Controladora (nutricionista, via responsável do produto)

## Contexto
Planos cuja origem é um rascunho do Agente Clínico (origem `IA_RASCUNHO`) exibiam na PWA do paciente o banner **"Sugestão gerada por IA e revisada pela sua nutricionista."**. Esse banner **não** é exigido pelas regras não-negociáveis do projeto — elas exigem o disclaimer CFN **na etapa de revisão** (voltado à nutricionista, no admin), não ao paciente. Uma vez aprovado, o plano é a recomendação profissional da nutricionista, que assume a responsabilidade clínica (ver [ADR-0003](0003-gate-aprovacao-humana-ia.md)).

O texto anterior podia **minar a confiança** do paciente ("meu plano foi feito por robô"), apesar de a nutri ter revisado e aprovado. Ao mesmo tempo, há corrente regulatória crescente (transparência de conteúdo gerado por IA) que favorece **algum** grau de disclosure ao usuário final.

## Decisão
Suavizar o banner na PWA para **"Plano revisado e aprovado pela sua nutricionista."** (ícone ✓ em vez de ✨), retirando a ênfase em "IA" mas mantendo a mensagem de responsabilidade profissional. **O disclaimer CFN voltado à nutricionista, no rascunho/admin, permanece inalterado — é inegociável.**

## Consequências
- Positivas: foco na responsabilidade profissional; menos ruído de confiança para o paciente; o banco ainda registra `origem=IA_RASCUNHO` (rastreabilidade interna preservada).
- Negativas / trade-offs: reduz a transparência explícita de IA ao paciente — decisão a **confirmar com parecer jurídico/CFN** antes de tratar como definitiva; se a regulação exigir disclosure ao usuário final, reverter/ajustar.
- Obriga: manter o disclaimer CFN na etapa de revisão (nutri) e o gate de aprovação humana; manter `origem` no dado para auditoria.

## Alternativas consideradas
- **A. Manter** "Sugestão gerada por IA…" — transparência máxima, mas risco de minar confiança do paciente.
- **C. Remover o banner** — mais limpo, mas perde qualquer sinal de revisão profissional e de transparência; mais exposto a exigências regulatórias futuras.
