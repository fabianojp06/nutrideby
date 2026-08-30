"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Error boundary do App Router: evita a tela branca de "Application error"
// quando um Server Component lança (ex.: falha de rede ao gateway). Mostra
// uma mensagem amigável e um botão de tentar de novo. Não expõe detalhes
// sensíveis do erro ao usuário.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log no console do servidor/cliente para diagnóstico (sem PII).
    console.error("Erro na renderização:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-brand-900">
        Algo deu errado
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta página. Isso pode ser uma falha
        temporária de conexão com o servidor. Tente novamente.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
