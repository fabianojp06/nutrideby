import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAssinatura, getFaturas } from "@/lib/api";
import { planoApiParaCatalogo, planosPrecos } from "@/lib/planos-catalog";
import { Download } from "lucide-react";
import { StatusFatura } from "@/types";

const statusConfig: Record<StatusFatura, { label: string; variant: "success" | "warning" | "destructive" }> = {
  paga: { label: "Paga", variant: "success" },
  pendente: { label: "Pendente", variant: "warning" },
  falhou: { label: "Falhou", variant: "destructive" },
};

export default async function AssinaturaPage() {
  const [faturas, assinatura] = await Promise.all([
    getFaturas(),
    getAssinatura(),
  ]);
  const planoAtualKey = assinatura
    ? planoApiParaCatalogo(assinatura.plano)
    : undefined;
  const planoAtual = planoAtualKey ? planosPrecos[planoAtualKey] : undefined;

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-brand-900">Assinatura e faturamento</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
          <CardDescription>Cobrança recorrente via Pix ou cartão de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          {planoAtual ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-brand-900">{planoAtual.nome}</p>
                <p className="text-sm text-muted-foreground">{planoAtual.limitePacientes}</p>
                {assinatura && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Situação: {assinatura.status}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-brand-900">
                  R$ {planoAtual.preco.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Alterar plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
              Nenhum plano ativo. Assine um plano para cadastrar pacientes.
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3">
            {(Object.keys(planosPrecos) as (keyof typeof planosPrecos)[]).map((key) => {
              const plano = planosPrecos[key];
              const atual = key === planoAtualKey;
              return (
                <div
                  key={key}
                  className={`rounded-md border p-3 text-sm ${
                    atual ? "border-brand-500 bg-brand-50" : "border-border"
                  }`}
                >
                  <p className="font-medium">{plano.nome}</p>
                  <p className="text-muted-foreground">R$ {plano.preco.toFixed(2)}/mês</p>
                  <p className="text-xs text-muted-foreground">{plano.limitePacientes}</p>
                  {atual && <Badge className="mt-2">Plano atual</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de faturas</CardTitle>
          <CardDescription>Controle financeiro do seu consultório</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3 font-medium">Competência</th>
                <th className="px-5 py-3 font-medium">Vencimento</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {faturas.map((fatura) => {
                const status = statusConfig[fatura.status];
                return (
                  <tr key={fatura.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{fatura.competencia}</td>
                    <td className="px-5 py-3 text-muted-foreground">{fatura.vencimento}</td>
                    <td className="px-5 py-3">R$ {fatura.valor.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {fatura.reciboUrl ? (
                        <a href={fatura.reciboUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                            Recibo
                          </Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4" />
                          Recibo
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
