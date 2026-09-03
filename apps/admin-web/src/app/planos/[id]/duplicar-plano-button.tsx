"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { duplicarPlano, DuplicarPlanoState } from "@/lib/planos-actions";
import type { Paciente } from "@/types";

// Item 17 (fatia 2): duplica o plano para um paciente escolhido (o mesmo ou
// outro). Sem componentes dialog/select do shadcn instalados, abrimos um painel
// inline com <select> nativo estilizado. A cópia nasce como rascunho não
// aprovado (gate de compliance) — o aviso na UI reforça isso.
export function DuplicarPlanoButton({
  pacienteOrigemId,
  planoId,
  pacientes,
  pacienteAtualId,
}: {
  pacienteOrigemId: string;
  planoId: string;
  pacientes: Paciente[];
  pacienteAtualId: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState(pacienteAtualId);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<DuplicarPlanoState | null>(null);

  function confirmar() {
    setResultado(null);
    startTransition(async () => {
      const r = await duplicarPlano(pacienteOrigemId, planoId, destino);
      setResultado(r);
      if (r.sucesso && r.novoPlano) {
        router.push(
          `/planos/${r.novoPlano.id}?pacienteId=${r.novoPlano.pacienteId}`
        );
      }
    });
  }

  if (!aberto) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setAberto(true)}
      >
        <Copy className="h-4 w-4" />
        Duplicar
      </Button>
    );
  }

  return (
    <div className="w-72 rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="paciente-destino">Duplicar para o paciente</Label>
        <select
          id="paciente-destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          disabled={pending}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.id === pacienteAtualId ? " (paciente atual)" : ""}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        A cópia será criada como rascunho e precisará ser aprovada antes de
        ficar visível ao paciente.
      </p>

      {resultado?.erro && (
        <p className="mt-2 text-sm text-destructive">{resultado.erro}</p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAberto(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={confirmar} disabled={pending}>
          {pending ? "Duplicando..." : "Confirmar cópia"}
        </Button>
      </div>
    </div>
  );
}
