"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { criarProntuario, DadosProntuario } from "@/lib/prontuario-actions";
import { incorporarAnamnese } from "@/lib/anamnese-actions";
import type { ProntuarioRaw } from "@/lib/api";

// Campos de texto da anamnese (label + chave). Pré-preenchidos a partir do
// último prontuário: a nutri não redigita a anamnese, só ajusta o que mudou.
const CAMPOS_ANAMNESE: {
  chave: keyof Pick<
    DadosProntuario,
    | "queixaPrincipal"
    | "historicoClinico"
    | "historicoFamiliar"
    | "habitosAlimentares"
    | "usoMedicamentos"
    | "alergias"
    | "intolerancias"
    | "nivelAtividadeFisica"
    | "observacoesGerais"
  >;
  label: string;
  placeholder: string;
}[] = [
  { chave: "queixaPrincipal", label: "Queixa principal", placeholder: "Motivo da consulta" },
  { chave: "historicoClinico", label: "Histórico clínico", placeholder: "Condições, cirurgias, diagnósticos" },
  { chave: "historicoFamiliar", label: "Histórico familiar", placeholder: "Doenças na família" },
  { chave: "habitosAlimentares", label: "Hábitos alimentares", placeholder: "Rotina alimentar atual" },
  { chave: "usoMedicamentos", label: "Uso de medicamentos", placeholder: "Medicamentos e suplementos em uso" },
  { chave: "alergias", label: "Alergias", placeholder: "Alergias alimentares/outras" },
  { chave: "intolerancias", label: "Intolerâncias", placeholder: "Ex.: lactose, glúten" },
  { chave: "nivelAtividadeFisica", label: "Nível de atividade física", placeholder: "Ex.: sedentário, 3x/semana" },
  { chave: "observacoesGerais", label: "Observações gerais", placeholder: "Outras anotações da consulta" },
];

type TextoState = Record<(typeof CAMPOS_ANAMNESE)[number]["chave"], string>;

function textoInicial(v?: ProntuarioRaw): TextoState {
  return {
    queixaPrincipal: v?.queixaPrincipal ?? "",
    historicoClinico: v?.historicoClinico ?? "",
    historicoFamiliar: v?.historicoFamiliar ?? "",
    habitosAlimentares: v?.habitosAlimentares ?? "",
    usoMedicamentos: v?.usoMedicamentos ?? "",
    alergias: v?.alergias ?? "",
    intolerancias: v?.intolerancias ?? "",
    nivelAtividadeFisica: v?.nivelAtividadeFisica ?? "",
    observacoesGerais: v?.observacoesGerais ?? "",
  };
}

function numStr(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}

interface ProntuarioEditorProps {
  pacienteId: string;
  valoresIniciais?: ProntuarioRaw;
  // Item 20 (fase 3): quando o editor abre a partir da anamnese auto-declarada,
  // recebe o ID dela. Após salvar o prontuário com sucesso, marcamos a anamnese
  // como INCORPORADA (nunca antes; nunca automático).
  anamneseIdParaIncorporar?: string;
}

export function ProntuarioEditor({
  pacienteId,
  valoresIniciais,
  anamneseIdParaIncorporar,
}: ProntuarioEditorProps) {
  const router = useRouter();

  const [texto, setTexto] = useState<TextoState>(() => textoInicial(valoresIniciais));
  // Antropometria: peso/medidas normalmente MUDAM a cada consulta, então NÃO
  // pré-preenchemos peso; altura costuma repetir, então a mantemos como conveniência.
  // Exceção: vindo da anamnese, pré-preenchemos o peso AUTO-DECLARADO (provisório)
  // para a nutri confirmar/corrigir na consulta.
  const [pesoKg, setPesoKg] = useState(
    anamneseIdParaIncorporar ? numStr(valoresIniciais?.pesoKg) : ""
  );
  const [alturaCm, setAlturaCm] = useState(numStr(valoresIniciais?.alturaCm));
  const [cintura, setCintura] = useState("");
  const [quadril, setQuadril] = useState("");
  const [gordura, setGordura] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setCampoTexto(chave: keyof TextoState, valor: string) {
    setTexto((t) => ({ ...t, [chave]: valor }));
  }

  // IMC calculado no submit a partir de peso+altura (imc = peso/(altura/100)^2).
  // A nutri NÃO digita IMC.
  const pesoNum = pesoKg.trim() ? Number(pesoKg) : NaN;
  const alturaNum = alturaCm.trim() ? Number(alturaCm) : NaN;
  const imcPrevia =
    !Number.isNaN(pesoNum) && !Number.isNaN(alturaNum) && alturaNum > 0
      ? Number((pesoNum / Math.pow(alturaNum / 100, 2)).toFixed(2))
      : null;

  function numeroValido(v: string): { ok: boolean; valor?: number } {
    if (!v.trim()) return { ok: true };
    const n = Number(v);
    if (Number.isNaN(n) || n < 0) return { ok: false };
    return { ok: true, valor: n };
  }

  function salvar() {
    setErro(null);
    setSucesso(null);

    const campos: { rotulo: string; str: string }[] = [
      { rotulo: "Peso", str: pesoKg },
      { rotulo: "Altura", str: alturaCm },
      { rotulo: "Circunferência da cintura", str: cintura },
      { rotulo: "Circunferência do quadril", str: quadril },
      { rotulo: "Percentual de gordura", str: gordura },
    ];
    for (const c of campos) {
      if (!numeroValido(c.str).ok) {
        setErro(`${c.rotulo}: informe um número válido (≥ 0).`);
        return;
      }
    }

    const dados: DadosProntuario = {};
    for (const { chave } of CAMPOS_ANAMNESE) {
      const v = texto[chave].trim();
      if (v) dados[chave] = v;
    }
    const peso = numeroValido(pesoKg).valor;
    const altura = numeroValido(alturaCm).valor;
    if (peso != null) dados.pesoKg = peso;
    if (altura != null) dados.alturaCm = altura;
    const cint = numeroValido(cintura).valor;
    if (cint != null) dados.circunferenciaCintura = cint;
    const quad = numeroValido(quadril).valor;
    if (quad != null) dados.circunferenciaQuadril = quad;
    const gord = numeroValido(gordura).valor;
    if (gord != null) dados.percentualGordura = gord;
    if (imcPrevia != null) dados.imc = imcPrevia;

    if (Object.keys(dados).length === 0) {
      setErro("Preencha ao menos um campo antes de registrar.");
      return;
    }

    startTransition(async () => {
      const r = await criarProntuario(pacienteId, dados);
      if (r.erro) {
        setErro(r.erro);
        return;
      }

      // Fluxo vindo da anamnese: o prontuário JÁ foi salvo. Agora marcamos a
      // anamnese como incorporada. Se isto falhar, NÃO perdemos o prontuário —
      // avisamos e a nutri pode voltar e tentar de novo (a ação é idempotente).
      if (anamneseIdParaIncorporar) {
        const inc = await incorporarAnamnese(
          pacienteId,
          anamneseIdParaIncorporar
        );
        if (inc.erro) {
          setSucesso(
            "Prontuário registrado, mas não foi possível marcar a anamnese como incorporada: " +
              inc.erro +
              " O prontuário está salvo; você pode tentar incorporar novamente."
          );
          router.refresh();
          return;
        }
        setSucesso("Prontuário registrado e anamnese incorporada.");
        router.push(`/pacientes/${pacienteId}`);
        return;
      }

      setSucesso(r.sucesso ?? "Prontuário registrado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {anamneseIdParaIncorporar ? (
        <div className="rounded-md border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
          Pré-preenchido a partir do que o <strong>paciente informou</strong> —
          revise antes de salvar. Peso e altura são auto-declarados
          (provisórios). Ao salvar, um novo prontuário é registrado e a anamnese
          é marcada como incorporada.
        </div>
      ) : (
        valoresIniciais && (
          <div className="rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
            Campos pré-preenchidos a partir da última consulta. Ao salvar, um{" "}
            <strong>novo prontuário</strong> é registrado (o histórico anterior é
            preservado para a evolução).
          </div>
        )
      )}

      <Card>
        <CardHeader>
          <CardTitle>Anamnese</CardTitle>
          <CardDescription>Histórico e hábitos do paciente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CAMPOS_ANAMNESE.map(({ chave, label, placeholder }) => (
            <div key={chave} className="space-y-1.5">
              <Label htmlFor={chave}>{label}</Label>
              <textarea
                id={chave}
                value={texto[chave]}
                onChange={(e) => setCampoTexto(chave, e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antropometria</CardTitle>
          <CardDescription>Medidas desta consulta. O IMC é calculado automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pesoKg">Peso (kg)</Label>
              <Input
                id="pesoKg"
                type="number"
                min={0}
                step="0.1"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                placeholder="Ex.: 72.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alturaCm">Altura (cm)</Label>
              <Input
                id="alturaCm"
                type="number"
                min={0}
                step="0.1"
                value={alturaCm}
                onChange={(e) => setAlturaCm(e.target.value)}
                placeholder="Ex.: 168"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cintura">Circunferência da cintura (cm)</Label>
              <Input
                id="cintura"
                type="number"
                min={0}
                step="0.1"
                value={cintura}
                onChange={(e) => setCintura(e.target.value)}
                placeholder="Ex.: 80"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quadril">Circunferência do quadril (cm)</Label>
              <Input
                id="quadril"
                type="number"
                min={0}
                step="0.1"
                value={quadril}
                onChange={(e) => setQuadril(e.target.value)}
                placeholder="Ex.: 95"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gordura">Percentual de gordura (%)</Label>
              <Input
                id="gordura"
                type="number"
                min={0}
                step="0.1"
                value={gordura}
                onChange={(e) => setGordura(e.target.value)}
                placeholder="Ex.: 22"
              />
            </div>
            <div className="space-y-1.5">
              <Label>IMC (calculado)</Label>
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                {imcPrevia != null ? imcPrevia : "Informe peso e altura"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {sucesso && (
        <div className="space-y-2">
          <p className="text-sm text-emerald-600">{sucesso}</p>
          <Link
            href={`/pacientes/${pacienteId}`}
            className="text-sm text-brand-700 hover:underline"
          >
            Voltar ao paciente
          </Link>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending ? "Salvando..." : "Registrar prontuário"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
