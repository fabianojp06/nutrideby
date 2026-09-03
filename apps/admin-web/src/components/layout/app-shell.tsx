import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { getNutricionistaAtual } from "@/lib/api";
import { ApiError } from "@/lib/apiClient";
import type { Nutricionista } from "@/types";

export async function AppShell({ children }: { children: React.ReactNode }) {
  // Rede de segurança do gate de sessão: se o token estiver presente mas o
  // gateway responder 401 (expirou entre o middleware e o render, ou foi
  // revogado — casos que o middleware não pega só olhando o `exp`), manda
  // para o login em vez de estourar no boundary "Algo deu errado". O
  // middleware já cobre o caso comum (exp no passado) antes de renderizar.
  let nutricionista: Nutricionista;
  try {
    nutricionista = await getNutricionistaAtual();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar nutricionista={nutricionista} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
