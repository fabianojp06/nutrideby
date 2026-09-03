import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getNutricionistaAtual } from "@/lib/api";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const nutricionista = await getNutricionistaAtual();
  const semDocumento = !nutricionista.cpfCnpj;

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-brand-900">
        Meu perfil
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            Mantenha seus dados atualizados. O CPF/CNPJ é usado para emitir a
            cobrança do plano pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {semDocumento && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Você ainda não informou seu CPF/CNPJ. Preencha abaixo para poder
              assinar um plano pago.
            </div>
          )}
          <PerfilForm nutricionista={nutricionista} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
