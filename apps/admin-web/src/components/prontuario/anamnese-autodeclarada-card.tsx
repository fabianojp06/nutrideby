import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnamneseAutodeclarada } from "@/lib/api";

// Item 20 (fase 3): exibe a anamnese que o PACIENTE respondeu por conta própria.
// É RELATO auto-declarado, não prontuário. A nutri revisa/edita e salva o
// prontuário oficial; só então marcamos a anamnese como incorporada. Sem
// auto-incorporação. Este componente é read-only (a ação vive no editor de
// prontuário, alcançado pelo botão abaixo).

const CAMPOS: { chave: keyof AnamneseAutodeclarada; label: string }[] = [
  { chave: "objetivo", label: "Objetivo" },
  { chave: "queixaPrincipal", label: "Queixa principal" },
  { chave: "historicoClinico", label: "Histórico clínico" },
  { chave: "historicoFamiliar", label: "Histórico familiar" },
  { chave: "habitosAlimentares", label: "Hábitos alimentares" },
  { chave: "usoMedicamentos", label: "Uso de medicamentos" },
  { chave: "alergias", label: "Alergias" },
  { chave: "intolerancias", label: "Intolerâncias" },
  { chave: "nivelAtividadeFisica", label: "Nível de atividade física" },
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
  { chave: "observacoesGerais", label: "Observações gerais" },
];

function formatarData(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

export function AnamneseAutodeclaradaCard({
  pacienteId,
  anamnese,
}: {
  pacienteId: string;
  anamnese: AnamneseAutodeclarada;
}) {
  if (anamnese.status === "INCORPORADA") {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ClipboardList className="h-4 w-4" />
        Anamnese do paciente incorporada
        {anamnese.incorporadoEm
          ? ` em ${formatarData(anamnese.incorporadoEm)}`
          : ""}
        .
      </div>
    );
  }

  const preenchidos = CAMPOS.filter(
    ({ chave }) => Boolean(anamnese[chave])
  );

  return (
    <Card className="mt-6 border-amber-300 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              Anamnese respondida pelo paciente — aguardando revisão
            </CardTitle>
            <CardDescription>
              Relato auto-declarado pelo paciente em{" "}
              {formatarData(anamnese.respondidoEm)}. Ainda NÃO faz parte do
              prontuário — revise e edite antes de incorporar.
            </CardDescription>
          </div>
          <Badge variant="warning">Pendente de revisão</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {(anamnese.pesoDeclaradoKg || anamnese.alturaDeclaradaCm) && (
          <div className="flex flex-wrap gap-4 rounded-md border border-amber-200 bg-white/60 px-3 py-2">
            {anamnese.pesoDeclaradoKg && (
              <div>
                <p className="font-medium text-foreground">
                  Peso (auto-declarado / provisório)
                </p>
                <p className="text-muted-foreground">
                  {anamnese.pesoDeclaradoKg} kg
                </p>
              </div>
            )}
            {anamnese.alturaDeclaradaCm && (
              <div>
                <p className="font-medium text-foreground">
                  Altura (auto-declarado / provisório)
                </p>
                <p className="text-muted-foreground">
                  {anamnese.alturaDeclaradaCm} cm
                </p>
              </div>
            )}
          </div>
        )}

        {preenchidos.length === 0 ? (
          <p className="text-muted-foreground">
            O paciente enviou a anamnese sem preencher campos de texto.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {preenchidos.map(({ chave, label }) => (
              <div key={chave}>
                <p className="font-medium text-foreground">
                  {label}{" "}
                  <span className="font-normal text-muted-foreground">
                    (informado pelo paciente)
                  </span>
                </p>
                <p className="whitespace-pre-line text-muted-foreground">
                  {String(anamnese[chave])}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link
            href={`/pacientes/${pacienteId}/prontuario?fromAnamnese=${anamnese.id}`}
          >
            <Button>Revisar e incorporar ao prontuário</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
