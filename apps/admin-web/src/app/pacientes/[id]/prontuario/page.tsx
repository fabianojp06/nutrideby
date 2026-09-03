import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProntuarioEditor } from "@/components/prontuario/prontuario-editor";
import { getPaciente, getProntuarioRaw } from "@/lib/api";

// Rota do editor de PRONTUÁRIO/ANTROPOMETRIA (item 18). Registra uma nova
// consulta (POST), pré-preenchendo a partir do prontuário mais recente. O id do
// paciente vem por path (padrão do app); dado de saúde só trafega em body.
export default async function ProntuarioPage({
  params,
}: {
  params: { id: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  const valoresIniciais = await getProntuarioRaw(params.id);

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href={`/pacientes/${params.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {paciente.nome}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-900">
          Registrar prontuário
        </h1>
        <p className="text-sm text-muted-foreground">
          Paciente: {paciente.nome}. Cada registro é o snapshot de uma consulta.
        </p>
      </div>

      <ProntuarioEditor
        pacienteId={params.id}
        valoresIniciais={valoresIniciais}
      />
    </AppShell>
  );
}
