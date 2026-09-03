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
}: {
  pacienteId: string;
  planoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<AprovarPlanoState | null>(null);

  function confirmarEAprovar() {
    const ok = window.confirm(
      "Aprovar este plano? Ao aprovar, este plano fica visível para o paciente. Esta ação não pode ser desfeita."
    );
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
      {resultado?.erro && (
        <p className="text-sm text-destructive">{resultado.erro}</p>
      )}
    </div>
  );
}
