import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patients/status-badge";
import { EvolutionChart } from "@/components/patients/evolution-chart";
import { GerarRascunhoIA } from "./gerar-rascunho-ia";
import { AnamneseAutodeclaradaCard } from "@/components/prontuario/anamnese-autodeclarada-card";
import {
  getPaciente,
  getProntuario,
  getPlanosAlimentaresDoPaciente,
  getRegistrosPeso,
  getAnamneseDoPaciente,
} from "@/lib/api";

// A geração de rascunho por IA (Agente Clínico RAG) roda como Server Action a
// partir desta rota e pode levar até ~60s (Voyage + Claude). Sem isto, a função
// serverless da Vercel encerraria antes e o usuário veria "indisponível". O
// gateway tem timeout próprio (RAG_AGENT_TIMEOUT_MS=90s); este alinha o teto da
// Vercel. Sujeito ao limite do plano da Vercel.
export const maxDuration = 90;

export default async function PacienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  const [prontuario, planos, registrosPeso, anamnese] = await Promise.all([
    getProntuario(params.id),
    getPlanosAlimentaresDoPaciente(params.id),
    getRegistrosPeso(params.id),
    getAnamneseDoPaciente(params.id),
  ]);

  // Junta a antropometria do prontuário com o peso que o paciente lança na PWA
  // (RegistroPeso). Para os pontos só-peso, calcula o IMC usando a última
  // altura conhecida no prontuário, para o gráfico manter a linha de IMC.
  const alturaRef =
    [...(prontuario?.antropometria ?? [])]
      .reverse()
      .find((a) => a.alturaCm > 0)?.alturaCm ?? 0;
  const evolucao = [
    ...(prontuario?.antropometria ?? []),
    ...registrosPeso.map((r) => ({
      data: r.data,
      pesoKg: r.pesoKg,
      alturaCm: alturaRef,
      imc: alturaRef
        ? Number((r.pesoKg / Math.pow(alturaRef / 100, 2)).toFixed(1))
        : 0,
    })),
  ].sort((a, b) => a.data.localeCompare(b.data));
  const ultimoRegistro = evolucao[evolucao.length - 1];

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-brand-900">{paciente.nome}</h1>
            <StatusBadge status={paciente.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {paciente.email} · {paciente.telefone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GerarRascunhoIA pacienteId={paciente.id} />
          <Link href={`/pacientes/${paciente.id}/prontuario`}>
            <Button variant="outline">Registrar prontuário</Button>
          </Link>
          <Link href={`/planos/novo?pacienteId=${paciente.id}`}>
            <Button>Novo plano alimentar</Button>
          </Link>
        </div>
      </div>

      {anamnese && (
        <AnamneseAutodeclaradaCard
          pacienteId={paciente.id}
          anamnese={anamnese}
        />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Anamnese</CardTitle>
            <CardDescription>Última atualização: {prontuario?.anamnese.atualizadoEm ?? "—"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Queixa principal</p>
              <p className="text-muted-foreground">{prontuario?.anamnese.queixaPrincipal ?? "—"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Histórico alimentar</p>
              <p className="text-muted-foreground">{prontuario?.anamnese.historicoAlimentar ?? "—"}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="font-medium text-foreground">Restrições</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {prontuario?.anamnese.restricoes.length ? (
                    prontuario.anamnese.restricoes.map((r) => (
                      <Badge key={r} variant="outline">{r}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nenhuma</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">Condições clínicas</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {prontuario?.anamnese.condicoesClinicas.length ? (
                    prontuario.anamnese.condicoesClinicas.map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nenhuma</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados antropométricos</CardTitle>
            <CardDescription>Registro mais recente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peso</span>
              <span className="font-medium">{ultimoRegistro?.pesoKg ?? "—"} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Altura</span>
              <span className="font-medium">{ultimoRegistro?.alturaCm ?? "—"} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IMC</span>
              <span className="font-medium">{ultimoRegistro?.imc ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evolução antropométrica</CardTitle>
          <CardDescription>
            Peso e IMC ao longo do tempo — inclui as consultas e as pesagens que o
            paciente registra pelo app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evolucao.length > 0 ? (
            <EvolutionChart dados={evolucao} />
          ) : (
            <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Planos alimentares</CardTitle>
          <CardDescription>Histórico de planos deste paciente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {planos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum plano criado ainda.</p>
          )}
          {planos.map((plano) => (
            <Link
              key={plano.id}
              href={`/planos/${plano.id}?pacienteId=${plano.pacienteId}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-brand-50/60"
            >
              <div>
                <p className="font-medium">{plano.nome}</p>
                <p className="text-xs text-muted-foreground">Criado em {plano.criadoEm}</p>
              </div>
              <Badge variant={plano.aprovado ? "success" : "warning"}>
                {plano.aprovado ? "Aprovado" : "Rascunho"}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
