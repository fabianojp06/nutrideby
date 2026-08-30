import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NovoPacienteForm } from "./novo-paciente-form";

export default function NovoPacientePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold text-brand-900">Novo paciente</h1>
        <p className="text-sm text-muted-foreground">
          O paciente recebe uma senha inicial para acessar a PWA e assinar o
          Termo de Consentimento.
        </p>
      </div>

      <NovoPacienteForm />
    </AppShell>
  );
}
