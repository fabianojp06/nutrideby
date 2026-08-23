import { Refeicao } from "@/types";

export function calcularTotais(refeicoes: Refeicao[]) {
  return refeicoes
    .flatMap((r) => r.itens)
    .reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.kcal,
        proteinasG: acc.proteinasG + item.proteinasG,
        carboidratosG: acc.carboidratosG + item.carboidratosG,
        gordurasG: acc.gordurasG + item.gordurasG,
      }),
      { kcal: 0, proteinasG: 0, carboidratosG: 0, gordurasG: 0 }
    );
}

export function MacroTotals({ refeicoes }: { refeicoes: Refeicao[] }) {
  const totais = calcularTotais(refeicoes);

  const cards = [
    { label: "Calorias", valor: `${totais.kcal} kcal` },
    { label: "Proteínas", valor: `${totais.proteinasG} g` },
    { label: "Carboidratos", valor: `${totais.carboidratosG} g` },
    { label: "Gorduras", valor: `${totais.gordurasG} g` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-center"
        >
          <p className="text-xs uppercase text-brand-600">{card.label}</p>
          <p className="text-lg font-semibold text-brand-900">{card.valor}</p>
        </div>
      ))}
    </div>
  );
}
