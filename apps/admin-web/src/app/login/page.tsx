"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { planosPrecos } from "@/lib/planos-catalog";
import {
  AuthActionState,
  loginNutricionista,
  registrarNutricionista,
} from "@/lib/auth";

type Modo = "login" | "cadastro";
type Plano = keyof typeof planosPrecos;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Aguarde..." : children}
    </Button>
  );
}

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("login");
  const [planoEscolhido, setPlanoEscolhido] = useState<Plano>("pro");
  const router = useRouter();

  const estadoInicial: AuthActionState = {};
  const [loginState, loginAction] = useFormState(
    loginNutricionista,
    estadoInicial
  );
  const [cadastroState, cadastroAction] = useFormState(
    registrarNutricionista,
    estadoInicial
  );

  // Sucesso da action = objeto sem `erro` e sem estado inicial. As actions
  // gravam o cookie httpOnly no servidor; aqui só navegamos para o dashboard.
  useEffect(() => {
    if (loginState && !loginState.erro && loginState !== estadoInicial) {
      router.push("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginState]);

  useEffect(() => {
    if (cadastroState && !cadastroState.erro && cadastroState !== estadoInicial) {
      router.push("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadastroState]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-brand-700">
          <Leaf className="h-7 w-7" />
          <span className="text-2xl font-semibold">NutriDeby</span>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-5 flex rounded-md bg-muted p-1">
              <button
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                  modo === "login" ? "bg-white shadow-sm text-brand-700" : "text-muted-foreground"
                }`}
                onClick={() => setModo("login")}
              >
                Entrar
              </button>
              <button
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                  modo === "cadastro" ? "bg-white shadow-sm text-brand-700" : "text-muted-foreground"
                }`}
                onClick={() => setModo("cadastro")}
              >
                Criar conta
              </button>
            </div>

            {modo === "login" ? (
              <form className="space-y-4" action={loginAction}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="voce@clinica.com.br" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" placeholder="••••••••" required />
                </div>
                {loginState.erro && (
                  <p className="text-sm text-destructive">{loginState.erro}</p>
                )}
                <SubmitButton>Entrar</SubmitButton>
              </form>
            ) : (
              <form className="space-y-4" action={cadastroAction}>
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" name="nome" placeholder="Débora Oliveira" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="crn">CRN</Label>
                    <Input id="crn" name="crn" placeholder="CRN-3 12345" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input id="cpfCnpj" name="cpfCnpj" placeholder="000.000.000-00" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" name="email" type="email" placeholder="voce@clinica.com.br" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha2">Senha</Label>
                  <Input id="senha2" name="senha" type="password" placeholder="•••••••• (mín. 8)" required />
                </div>

                <div className="space-y-1.5">
                  <Label>Plano de assinatura</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(planosPrecos) as Plano[]).map((key) => {
                      const plano = planosPrecos[key];
                      const selecionado = planoEscolhido === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setPlanoEscolhido(key)}
                          className={`rounded-md border p-2.5 text-left text-xs transition-colors ${
                            selecionado
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-border text-muted-foreground hover:border-brand-200"
                          }`}
                        >
                          <p className="font-semibold">{plano.nome}</p>
                          <p>R$ {plano.preco.toFixed(2)}/mês</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A conta é criada sem plano ativo. A assinatura (Asaas) é um
                    passo à parte — cadastre pacientes após ativar um plano.
                  </p>
                </div>

                {cadastroState.erro && (
                  <p className="text-sm text-destructive">{cadastroState.erro}</p>
                )}
                <SubmitButton>Criar conta</SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          NutriDeby — dashboard da nutricionista.
        </p>
      </div>
    </div>
  );
}
