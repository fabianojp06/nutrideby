"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { aprovarPlano, AprovarPlanoState } from "@/lib/planos-actions";

// Ação irreversível de compliance: aprovar libera o plano (inclusive rascunho de
// IA) para o paciente ver na PWA. Sem componente de dialog instalado no admin-web,
// a confirmação usa window.confirm — deixando claro que o conteúdo fica visível.
export function AprovarPlanoButton({
  pacienteId,
  planoId,
  semRefeicoes = false,
}: {
  pacienteId: string;
  planoId: string;
  // Plano sem nenhuma refeição estruturada com itens: o paciente veria só o
  // texto (ex.: rascunho da IA em observações), não refeições. Avisa a nutri.
  semRefeicoes?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<AprovarPlanoState | null>(null);

  function confirmarEAprovar() {
    const aviso = semRefeicoes
      ? "Atenção: este plano NÃO tem refeições estruturadas. O paciente verá apenas o texto (sem refeições, kcal ou macros por refeição). Recomendamos montar as refeições no editor antes de aprovar.\n\nAprovar mesmo assim? Fica visível para o paciente e não pode ser desfeito."
      : "Aprovar este plano? Ao aprovar, este plano fica visível para o paciente. Esta ação não pode ser desfeita.";
    const ok = window.confirm(aviso);
    if (!ok) return;

    setResultado(null);
    startTransition(async () => {
      const r = await aprovarPlano(pacienteId, planoId);
      setResultado(r);
      // Sucesso: o revalidate no servidor já atualiza o badge e some com o botão;
      // refresh garante que o Server Component recarregue com o novo status.
      if (r.sucesso) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={confirmarEAprovar} disabled={pending}>
        <Check className="h-4 w-4" />
        {pending ? "Aprovando..." : "Aprovar e enviar"}
      </Button>
      {semRefeicoes && (
        <p className="max-w-[16rem] text-right text-xs text-amber-600">
          Sem refeições estruturadas — o paciente veria só texto. Monte as
          refeições no editor antes de aprovar.
        </p>
      )}
      {resultado?.erro && (
        <p className="text-sm text-destructive">{resultado.erro}</p>
      )}
    </div>
  );
}
