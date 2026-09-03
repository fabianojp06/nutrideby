import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PlanoEditor } from "@/components/plans/plano-editor";
import { getPlanoAlimentarRaw, getPaciente } from "@/lib/api";

// Sub-rota de EDIÇÃO. Escolhida em vez de um toggle inline na tela de detalhe
// porque a tela de detalhe é Server Component e busca via /calculo (dados de
// EXIBIÇÃO já calculados); o editor precisa do JSON CRU de refeicoes
// (getPlanoAlimentarRaw). Uma rota dedicada busca o shape certo no servidor e
// mantém a visualização (macros/cálculo) totalmente intacta.
export default async function EditarPlanoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pacienteId?: string };
}) {
  const pacienteId = searchParams.pacienteId;
  if (!pacienteId) notFound();

  const [plano, paciente] = await Promise.all([
    getPlanoAlimentarRaw(pacienteId, params.id),
    getPaciente(pacienteId),
  ]);
  if (!plano || !paciente) notFound();

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href={`/planos/${params.id}?pacienteId=${pacienteId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o plano
        </Link>
        <h1 className="text-2xl font-semibold text-brand-900">Editar plano</h1>
        <p className="text-sm text-muted-foreground">
          Paciente: {paciente.nome}
        </p>
      </div>

      <PlanoEditor
        pacienteId={pacienteId}
        planoId={plano.id}
        jaAprovado={plano.aprovadoPeloNutri}
        valoresIniciais={{
          titulo: plano.titulo,
          objetivo: plano.objetivo,
          caloriasAlvo: plano.caloriasAlvo,
          observacoes: plano.observacoes,
          refeicoes: plano.refeicoes,
        }}
      />
    </AppShell>
  );
}
