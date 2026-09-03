import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PlanoEditor } from "@/components/plans/plano-editor";
import { getPaciente } from "@/lib/api";

// Rota de CRIAÇÃO de plano. O link "Novo plano alimentar" na tela do paciente
// aponta para /planos/novo?pacienteId=... — antes essa rota não existia e caía
// em /planos/[id] tentando carregar um plano id="novo" (404). Aqui renderizamos
// o editor em modo criar. O pacienteId vem por query (padrão já usado no app;
// não é dado de saúde).
export default async function NovoPlanoPage({
  searchParams,
}: {
  searchParams: { pacienteId?: string };
}) {
  const pacienteId = searchParams.pacienteId;
  if (!pacienteId) notFound();

  const paciente = await getPaciente(pacienteId);
  if (!paciente) notFound();

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href={`/pacientes/${pacienteId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {paciente.nome}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-900">
          Novo plano alimentar
        </h1>
        <p className="text-sm text-muted-foreground">
          Paciente: {paciente.nome}. O plano nasce como rascunho e só fica
          visível ao paciente após aprovação.
        </p>
      </div>

      <PlanoEditor pacienteId={pacienteId} />
    </AppShell>
  );
}
