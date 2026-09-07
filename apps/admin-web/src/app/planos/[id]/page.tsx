import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MacroTotals } from "@/components/plans/macro-totals";
import { getPlanoAlimentar, getPaciente, getPacientes } from "@/lib/api";
import { AprovarPlanoButton } from "./aprovar-plano-button";
import { DuplicarPlanoButton } from "./duplicar-plano-button";
import { Pencil } from "lucide-react";

export default async function PlanoDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pacienteId?: string };
}) {
  // A rota real do gateway é ninhada (/pacientes/:pacienteId/planos-alimentares/:id):
  // não há como buscar um plano só pelo id. O pacienteId vem por query string
  // no link da página do paciente. GAP: sem endpoint de plano por id global.
  const pacienteId = searchParams.pacienteId;
  if (!pacienteId) notFound();

  const plano = await getPlanoAlimentar(pacienteId, params.id);
  if (!plano) notFound();

  const [paciente, pacientes] = await Promise.all([
    getPaciente(plano.pacienteId),
    getPacientes(),
  ]);

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">{plano.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Paciente: {paciente ? (
              <Link href={`/pacientes/${paciente.id}`} className="text-brand-700 hover:underline">
                {paciente.nome}
              </Link>
            ) : "—"} · Criado em {plano.criadoEm}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={plano.aprovado ? "success" : "warning"}>
              {plano.aprovado ? "Aprovado" : "Rascunho — revisão pendente"}
            </Badge>
            {plano.origem === "ia_rascunho" && (
              <Badge variant="outline">Gerado por IA — sugestão para revisão do profissional</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/planos/${plano.id}/editar?pacienteId=${plano.pacienteId}`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Editar plano
            </Button>
          </Link>
          <DuplicarPlanoButton
            pacienteOrigemId={plano.pacienteId}
            planoId={plano.id}
            pacientes={pacientes}
            pacienteAtualId={plano.pacienteId}
          />
          {!plano.aprovado && (
            <AprovarPlanoButton
              pacienteId={plano.pacienteId}
              planoId={plano.id}
              semRefeicoes={!plano.refeicoes.some((r) => r.itens.length > 0)}
            />
          )}
        </div>
      </div>

      {plano.origem === "ia_rascunho" && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Sugestão gerada por IA para revisão do profissional.</strong>{" "}
          Este conteúdo é um rascunho do Agente Clínico e não substitui a
          avaliação da nutricionista (Código de Ética CFN). Revise antes de
          aprovar e enviar ao paciente.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Totais de macronutrientes</CardTitle>
          <CardDescription>Calculado automaticamente a partir dos itens (TACO/TBCA)</CardDescription>
        </CardHeader>
        <CardContent>
          <MacroTotals refeicoes={plano.refeicoes} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {plano.refeicoes.map((refeicao) => (
          <Card key={refeicao.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{refeicao.nome}</CardTitle>
                <CardDescription>{refeicao.horario}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Alimento</th>
                    <th className="px-5 py-2 font-medium">Quantidade</th>
                    <th className="px-5 py-2 font-medium">Fonte</th>
                    <th className="px-5 py-2 font-medium">Kcal</th>
                    <th className="px-5 py-2 font-medium">P</th>
                    <th className="px-5 py-2 font-medium">C</th>
                    <th className="px-5 py-2 font-medium">G</th>
                  </tr>
                </thead>
                <tbody>
                  {refeicao.itens.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2">{item.nome}</td>
                      <td className="px-5 py-2 text-muted-foreground">{item.quantidade}</td>
                      <td className="px-5 py-2">
                        <Badge variant="outline">{item.fonte}</Badge>
                      </td>
                      <td className="px-5 py-2">{item.kcal}</td>
                      <td className="px-5 py-2">{item.proteinasG}g</td>
                      <td className="px-5 py-2">{item.carboidratosG}g</td>
                      <td className="px-5 py-2">{item.gordurasG}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
