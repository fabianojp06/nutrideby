"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { gerarRascunhoIA, RascunhoIaState } from "@/lib/planos-actions";

const MIN_CHARS = 3;
const MAX_CHARS = 4000;

// Item 17 (fatia 3): dispara o Agente Clínico RAG e exibe o RASCUNHO retornado.
// COMPLIANCE: este conteúdo é OUTPUT DE IA CLÍNICA e é apenas referência para a
// nutri montar o plano manualmente. Não é plano, não persiste, não vai ao
// paciente. O disclaimer CFN é exibido em destaque no topo do resultado; se o
// backend não enviar, usamos um texto CFN estático equivalente.
const DISCLAIMER_FALLBACK =
  "Sugestão gerada por IA para revisão do profissional. Este conteúdo não " +
  "substitui a avaliação da nutricionista (Código de Ética CFN).";

export function GerarRascunhoIA({ pacienteId }: { pacienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<RascunhoIaState | null>(null);

  const tamanho = pergunta.trim().length;
  const valido = tamanho >= MIN_CHARS && tamanho <= MAX_CHARS;

  function gerar() {
    if (!valido) return;
    setResultado(null);
    startTransition(async () => {
      const r = await gerarRascunhoIA(pacienteId, pergunta.trim());
      setResultado(r);
    });
  }

  if (!aberto) {
    return (
      <Button type="button" variant="outline" onClick={() => setAberto(true)}>
        <Sparkles className="h-4 w-4" />
        Gerar rascunho por IA
      </Button>
    );
  }

  const rascunho = resultado?.rascunho;

  return (
    <div className="w-full max-w-2xl rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pergunta-ia">
          O que o Agente Clínico deve considerar?
        </Label>
        <textarea
          id="pergunta-ia"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          disabled={pending}
          rows={4}
          maxLength={MAX_CHARS}
          placeholder="Ex.: monte um plano de 1800 kcal para emagrecimento, sem lactose"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          {tamanho}/{MAX_CHARS} caracteres · mínimo {MIN_CHARS}. A geração usa o
          prontuário do paciente e pode levar até ~20 segundos.
        </p>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAberto(false)}
          disabled={pending}
        >
          Fechar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={gerar}
          disabled={pending || !valido}
        >
          {pending ? "Gerando..." : "Gerar"}
        </Button>
      </div>

      {resultado?.erro && (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {resultado.erro}
        </div>
      )}

      {rascunho && (
        <div className="mt-4 space-y-4">
          {/* Disclaimer CFN em destaque, no topo do resultado (obrigatório). */}
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Atenção:</strong>{" "}
            {rascunho.disclaimer?.trim() || DISCLAIMER_FALLBACK}
          </div>

          <p className="text-xs text-muted-foreground">
            Este rascunho é uma referência para você montar o plano — não é
            enviado ao paciente.
          </p>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Rascunho
            </h3>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground">
              {rascunho.rascunho}
            </div>
          </div>

          {rascunho.fontesUtilizadas?.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                Fontes consultadas
              </h3>
              <ul className="space-y-2">
                {rascunho.fontesUtilizadas.map((f, i) => (
                  <li
                    key={`${f.source}-${i}`}
                    className="rounded-md border border-border bg-background px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {f.source}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(f.similaridade * 100)}% de similaridade
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{f.trecho}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Gerado por {rascunho.modeloUtilizado}
          </p>
        </div>
      )}
    </div>
  );
}
