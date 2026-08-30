import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patients/status-badge";
import { getPacientes } from "@/lib/api";
import { ApiError } from "@/lib/apiClient";
import type { Paciente } from "@/types";
import { Plus, ChevronRight, CreditCard } from "lucide-react";

// Estado exibido quando o gateway bloqueia por falta de plano ativo
// (AssinaturaAtivaGuard → 403). Evita a tela de erro e orienta a ação.
function PlanoNecessario({ mensagem }: { mensagem: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <CreditCard className="h-8 w-8 text-brand-600" />
        <h2 className="text-lg font-semibold text-brand-900">
          Ative um plano para começar
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">{mensagem}</p>
        <Link href="/assinatura">
          <Button>Ver planos</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  let pacientes: Paciente[];
  try {
    pacientes = await getPacientes();
  } catch (e) {
    // 403 = sem assinatura ativa: estado amigável, não erro.
    if (e instanceof ApiError && e.status === 403) {
      return (
        <AppShell>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-brand-900">Pacientes</h1>
          </div>
          <PlanoNecessario mensagem={e.message} />
        </AppShell>
      );
    }
    // Demais erros sobem para o error boundary (app/error.tsx).
    throw e;
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {pacientes.length} paciente(s) cadastrado(s)
          </p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo paciente
          </Button>
        </Link>
      </div>

      {pacientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum paciente ainda. Clique em <strong>Novo paciente</strong> para
            cadastrar o primeiro.
          </CardContent>
        </Card>
      ) : (
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
      )}
    </AppShell>
  );
}
