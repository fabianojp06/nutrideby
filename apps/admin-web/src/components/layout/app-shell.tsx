import { Sidebar } from "@/components/layout/sidebar";
import { getNutricionistaAtual } from "@/lib/api";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const nutricionista = await getNutricionistaAtual();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar nutricionista={nutricionista} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
