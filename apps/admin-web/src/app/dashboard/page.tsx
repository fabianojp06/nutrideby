import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patients/status-badge";
import { getPacientes } from "@/lib/api";
import { Plus, ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const pacientes = await getPacientes();

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {pacientes.length} paciente(s) cadastrado(s)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Contato</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Última consulta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => (
                <tr
                  key={paciente.id}
                  className="border-b border-border last:border-0 hover:bg-brand-50/60"
                >
                  <td className="px-5 py-3 font-medium text-foreground">
                    {paciente.nome}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {paciente.email}
                    <br />
                    {paciente.telefone}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={paciente.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {paciente.ultimaConsulta ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/pacientes/${paciente.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver prontuário
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
