"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { atualizarPerfil, AtualizarPerfilState } from "@/lib/perfil-actions";
import { Nutricionista } from "@/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar dados"}
    </Button>
  );
}

export function PerfilForm({
  nutricionista,
}: {
  nutricionista: Nutricionista;
}) {
  const estadoInicial: AtualizarPerfilState = {};
  const [state, action] = useFormState(atualizarPerfil, estadoInicial);

  return (
    <form className="space-y-4" action={action}>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" defaultValue={nutricionista.nome} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={nutricionista.email} disabled readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crn">CRN</Label>
          <Input id="crn" value={nutricionista.crn} disabled readOnly />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          defaultValue={nutricionista.telefone}
          placeholder="(11) 90000-0000"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
        <Input
          id="cpfCnpj"
          name="cpfCnpj"
          defaultValue={nutricionista.cpfCnpj}
          inputMode="numeric"
          placeholder="Somente números — CPF (11) ou CNPJ (14)"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Necessário para emitir a cobrança do plano pago. Aceita CPF (11
          dígitos) ou CNPJ (14 dígitos), com ou sem máscara.
        </p>
      </div>

      {state.erro && <p className="text-sm text-destructive">{state.erro}</p>}
      {state.sucesso && (
        <p className="text-sm text-emerald-600">{state.sucesso}</p>
      )}

      <div className="pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
