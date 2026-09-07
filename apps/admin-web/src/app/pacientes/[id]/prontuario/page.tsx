import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProntuarioEditor } from "@/components/prontuario/prontuario-editor";
import {
  getPaciente,
  getProntuarioRaw,
  getAnamneseDoPaciente,
  type ProntuarioRaw,
  type AnamneseAutodeclarada,
} from "@/lib/api";

// Rota do editor de PRONTUÁRIO/ANTROPOMETRIA (item 18). Registra uma nova
// consulta (POST), pré-preenchendo a partir do prontuário mais recente. O id do
// paciente vem por path (padrão do app); dado de saúde só trafega em body.
//
// Item 20 (fase 3): com ?fromAnamnese=<id>, pré-preenchemos a partir da anamnese
// AUTO-DECLARADA pelo paciente (relato, não prontuário). A nutri revisa/edita e
// salva; só então a anamnese é marcada como incorporada. Só o ID trafega na URL.

// Campos da anamnese SEM coluna 1:1 no prontuário: concatenados em
// observacoesGerais como texto rotulado para a nutri não perder a informação.
const CAMPOS_EXTRA: { chave: keyof AnamneseAutodeclarada; label: string }[] = [
  { chave: "objetivo", label: "Objetivo" },
  { chave: "preferenciasAversoes", label: "Preferências e aversões" },
  { chave: "rotinaRefeicoes", label: "Rotina de refeições" },
  { chave: "consumoAgua", label: "Consumo de água" },
  { chave: "habitoIntestinal", label: "Hábito intestinal" },
  { chave: "sono", label: "Sono" },
  { chave: "consumoAlcool", label: "Consumo de álcool" },
  { chave: "tabagismo", label: "Tabagismo" },
  { chave: "gestacaoLactacao", label: "Gestação / lactação" },
  { chave: "praticaExercicio", label: "Prática de exercício" },
  { chave: "suplementos", label: "Suplementos" },
];

function anamneseParaProntuarioRaw(a: AnamneseAutodeclarada): ProntuarioRaw {
  const extras = CAMPOS_EXTRA.map(({ chave, label }) => {
    const v = a[chave];
    return v ? `${label} (paciente): ${String(v)}` : null;
  }).filter((v): v is string => v != null);

  const observacoes = [
    a.observacoesGerais?.trim() || null,
    ...extras,
  ]
    .filter((v): v is string => Boolean(v))
    .join("\n");

  const parseNum = (v: string | null): number | null =>
    v != null && v.trim() ? Number(v) : null;

  return {
    id: a.id,
    pacienteId: a.pacienteId,
    queixaPrincipal: a.queixaPrincipal,
    historicoClinico: a.historicoClinico,
    historicoFamiliar: a.historicoFamiliar,
    habitosAlimentares: a.habitosAlimentares,
    usoMedicamentos: a.usoMedicamentos,
    alergias: a.alergias,
    intolerancias: a.intolerancias,
    nivelAtividadeFisica: a.nivelAtividadeFisica,
    observacoesGerais: observacoes || null,
    pesoKg: parseNum(a.pesoDeclaradoKg),
    alturaCm: parseNum(a.alturaDeclaradaCm),
    circunferenciaCintura: null,
    circunferenciaQuadril: null,
    percentualGordura: null,
    imc: null,
    criadoEm: a.respondidoEm,
    atualizadoEm: a.respondidoEm,
  };
}

export default async function ProntuarioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { fromAnamnese?: string };
}) {
  const paciente = await getPaciente(params.id);
  if (!paciente) notFound();

  const anamneseId = searchParams.fromAnamnese;

  let valoresIniciais: ProntuarioRaw | undefined;
  let anamneseIdParaIncorporar: string | undefined;

  if (anamneseId) {
    const anamnese = await getAnamneseDoPaciente(params.id);
    // Só pré-preenche se a anamnese existir, casar com o ID e estar pendente.
    if (
      anamnese &&
      anamnese.id === anamneseId &&
      anamnese.status === "PENDENTE_REVISAO"
    ) {
      valoresIniciais = anamneseParaProntuarioRaw(anamnese);
      anamneseIdParaIncorporar = anamnese.id;
    }
  }

  // Fluxo normal (item 18): pré-preenche a partir do último prontuário.
  if (!valoresIniciais) {
    valoresIniciais = await getProntuarioRaw(params.id);
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href={`/pacientes/${params.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {paciente.nome}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-900">
          Registrar prontuário
        </h1>
        <p className="text-sm text-muted-foreground">
          Paciente: {paciente.nome}. Cada registro é o snapshot de uma consulta.
        </p>
      </div>

      <ProntuarioEditor
        pacienteId={params.id}
        valoresIniciais={valoresIniciais}
        anamneseIdParaIncorporar={anamneseIdParaIncorporar}
      />
    </AppShell>
  );
}
