"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  converterParaPago,
  PlanoPago,
  ConverterParaPagoState,
} from "@/lib/assinatura-actions";
import { planosPrecos, planoApiParaCatalogo } from "@/lib/planos-catalog";
import { PlanoAssinatura } from "@/types";

// Mapeia a chave do catálogo (minúsculo) para o enum que o gateway espera.
const catalogoParaApi: Record<PlanoAssinatura, PlanoPago> = {
  starter: "STARTER",
  pro: "PRO",
  clinica: "CLINICA",
};

export function AssinarPlano({
  planoAtualApi,
  temCpfCnpj,
}: {
  planoAtualApi?: "STARTER" | "PRO" | "CLINICA";
  temCpfCnpj: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [planoEmProcesso, setPlanoEmProcesso] = useState<PlanoPago | null>(null);
  const [resultado, setResultado] = useState<ConverterParaPagoState | null>(
    null
  );

  const planoAtualKey = planoAtualApi
    ? planoApiParaCatalogo(planoAtualApi)
    : undefined;

  function assinar(plano: PlanoPago) {
    setResultado(null);
    setPlanoEmProcesso(plano);
    startTransition(async () => {
      const r = await converterParaPago(plano);
      setResultado(r);
      setPlanoEmProcesso(null);
      // Falta CPF/CNPJ: leva ao perfil em vez de só mostrar erro cru.
      if (r.faltaCpfCnpj) {
        router.push("/perfil");
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {!temCpfCnpj && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para assinar um plano pago, informe seu CPF/CNPJ no{" "}
          <a href="/perfil" className="font-medium underline">
            perfil
          </a>
          .
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.keys(planosPrecos) as PlanoAssinatura[]).map((key) => {
          const plano = planosPrecos[key];
          const atual = key === planoAtualKey;
          const apiPlano = catalogoParaApi[key];
          return (
            <div
              key={key}
              className={`flex flex-col rounded-md border p-3 text-sm ${
                atual ? "border-brand-500 bg-brand-50" : "border-border"
              }`}
            >
              <p className="font-medium">{plano.nome}</p>
              <p className="text-muted-foreground">
                R$ {plano.preco.toFixed(2)}/mês
              </p>
              <p className="text-xs text-muted-foreground">
                {plano.limitePacientes}
              </p>
              {atual && <Badge className="mt-2 w-fit">Plano atual</Badge>}
              <Button
                type="button"
                size="sm"
                variant={atual ? "outline" : "default"}
                className="mt-3"
                disabled={pending}
                onClick={() => assinar(apiPlano)}
              >
                {planoEmProcesso === apiPlano
                  ? "Gerando cobrança..."
                  : "Assinar plano pago"}
              </Button>
            </div>
          );
        })}
      </div>

      {resultado?.erro && !resultado.faltaCpfCnpj && (
        <p className="text-sm text-destructive">{resultado.erro}</p>
      )}
      {resultado?.sucesso && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {resultado.sucesso}
        </div>
      )}
    </div>
  );
}
