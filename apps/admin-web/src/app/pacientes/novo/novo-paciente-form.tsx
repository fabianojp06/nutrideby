"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { criarPaciente, CriarPacienteState } from "@/lib/pacientes-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Cadastrando..." : "Cadastrar paciente"}
    </Button>
  );
}

export function NovoPacienteForm() {
  const estadoInicial: CriarPacienteState = {};
  const [state, action] = useFormState(criarPaciente, estadoInicial);

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form className="space-y-4" action={action}>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" name="nome" required />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" placeholder="(11) 90000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Data de nascimento</Label>
              <Input id="dataNascimento" name="dataNascimento" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sexoBiologico">Sexo biológico</Label>
              <select
                id="sexoBiologico"
                name="sexoBiologico"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">Não informar</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha inicial</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="mín. 8 caracteres"
              required
            />
            <p className="text-xs text-muted-foreground">
              Compartilhe esta senha com o paciente para o primeiro acesso.
            </p>
          </div>

          {state.erro && <p className="text-sm text-destructive">{state.erro}</p>}

          <div className="flex gap-2 pt-1">
            <SubmitButton />
            <Link href="/dashboard">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
