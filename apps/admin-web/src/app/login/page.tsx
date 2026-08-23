"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { planosPrecos } from "@/lib/mock-data";

type Modo = "login" | "cadastro";
type Plano = keyof typeof planosPrecos;

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("login");
  const [planoEscolhido, setPlanoEscolhido] = useState<Plano>("pro");

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
              <form
                className="space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="voce@clinica.com.br" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" placeholder="••••••••" required />
                </div>
                <Link href="/dashboard">
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </Link>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" placeholder="Débora Oliveira" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="crn">CRN</Label>
                    <Input id="crn" placeholder="CRN-3 12345" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input id="cpfCnpj" placeholder="000.000.000-00" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" placeholder="voce@clinica.com.br" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha2">Senha</Label>
                  <Input id="senha2" type="password" placeholder="••••••••" required />
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
                    Você será redirecionado ao checkout de pagamento. A conta fica
                    &quot;pendente&quot; até a confirmação.
                  </p>
                </div>

                <Link href="/dashboard">
                  <Button type="submit" className="w-full">
                    Criar conta e ir para o checkout
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ambiente de demonstração — dados mockados, sem backend conectado.
        </p>
      </div>
    </div>
  );
}
