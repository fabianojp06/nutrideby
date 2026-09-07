"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Search, X } from "lucide-react";
import {
  criarPlano,
  atualizarPlano,
  buscarAlimentos,
  DadosPlano,
} from "@/lib/planos-actions";
import type { AlimentoTaco, RefeicaoRaw, ItemRefeicaoRaw } from "@/lib/api";

// Estado interno do editor. Cada item/refeição ganha um id LOCAL só para a key
// do React (não é enviado ao backend — o gateway persiste o JSON cru sem ids).
interface ItemEstado {
  localId: string;
  descricao: string;
  alimentoCodigo?: number;
  quantidadeGramas?: number;
}

interface RefeicaoEstado {
  localId: string;
  nome: string;
  horario: string;
  itens: ItemEstado[];
}

let contador = 0;
function novoId() {
  contador += 1;
  return `local-${contador}`;
}

function refeicoesIniciais(refeicoes?: RefeicaoRaw[]): RefeicaoEstado[] {
  if (!refeicoes || refeicoes.length === 0) return [];
  return refeicoes.map((r) => ({
    localId: novoId(),
    nome: r.nome ?? "",
    horario: r.horario ?? "",
    itens: (r.itens ?? []).map((it) => ({
      localId: novoId(),
      descricao: it.descricao ?? "",
      alimentoCodigo: it.alimentoCodigo,
      quantidadeGramas: it.quantidadeGramas,
    })),
  }));
}

// Converte o estado do editor para o shape EXATO que o cálculo TACO espera.
// Só emite os campos reconhecidos (nome, horario, itens[{descricao,
// alimentoCodigo, quantidadeGramas}]) — nada inventado. Item sem código nem
// descrição é descartado (linha vazia).
function paraPayload(refeicoes: RefeicaoEstado[]): RefeicaoRaw[] {
  return refeicoes.map((r) => {
    const itens: ItemRefeicaoRaw[] = r.itens
      .filter((it) => it.descricao.trim() || it.alimentoCodigo != null)
      .map((it) => {
        const item: ItemRefeicaoRaw = {};
        if (it.descricao.trim()) item.descricao = it.descricao.trim();
        if (it.alimentoCodigo != null) item.alimentoCodigo = it.alimentoCodigo;
        if (it.quantidadeGramas != null && !Number.isNaN(it.quantidadeGramas)) {
          item.quantidadeGramas = it.quantidadeGramas;
        }
        return item;
      });
    return {
      nome: r.nome.trim() || undefined,
      horario: r.horario.trim() || undefined,
      itens,
    };
  });
}

interface PlanoEditorProps {
  pacienteId: string;
  planoId?: string;
  valoresIniciais?: {
    titulo: string;
    objetivo: string;
    caloriasAlvo: number | null;
    observacoes: string;
    refeicoes: RefeicaoRaw[];
  };
  // Só relevante no modo edição: destaca o aviso de plano já aprovado.
  jaAprovado?: boolean;
}

export function PlanoEditor({
  pacienteId,
  planoId,
  valoresIniciais,
  jaAprovado,
}: PlanoEditorProps) {
  const router = useRouter();
  const modoEdicao = Boolean(planoId);

  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [objetivo, setObjetivo] = useState(valoresIniciais?.objetivo ?? "");
  const [caloriasAlvo, setCaloriasAlvo] = useState(
    valoresIniciais?.caloriasAlvo != null ? String(valoresIniciais.caloriasAlvo) : ""
  );
  const [observacoes, setObservacoes] = useState(
    valoresIniciais?.observacoes ?? ""
  );
  const [refeicoes, setRefeicoes] = useState<RefeicaoEstado[]>(() =>
    refeicoesIniciais(valoresIniciais?.refeicoes)
  );

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function adicionarRefeicao() {
    setRefeicoes((rs) => [
      ...rs,
      { localId: novoId(), nome: "", horario: "", itens: [] },
    ]);
  }

  function removerRefeicao(localId: string) {
    setRefeicoes((rs) => rs.filter((r) => r.localId !== localId));
  }

  function atualizarRefeicao(
    localId: string,
    campo: "nome" | "horario",
    valor: string
  ) {
    setRefeicoes((rs) =>
      rs.map((r) => (r.localId === localId ? { ...r, [campo]: valor } : r))
    );
  }

  function adicionarItem(refId: string) {
    setRefeicoes((rs) =>
      rs.map((r) =>
        r.localId === refId
          ? {
              ...r,
              itens: [
                ...r.itens,
                { localId: novoId(), descricao: "" },
              ],
            }
          : r
      )
    );
  }

  function removerItem(refId: string, itemId: string) {
    setRefeicoes((rs) =>
      rs.map((r) =>
        r.localId === refId
          ? { ...r, itens: r.itens.filter((it) => it.localId !== itemId) }
          : r
      )
    );
  }

  function atualizarItem(refId: string, itemId: string, patch: Partial<ItemEstado>) {
    setRefeicoes((rs) =>
      rs.map((r) =>
        r.localId === refId
          ? {
              ...r,
              itens: r.itens.map((it) =>
                it.localId === itemId ? { ...it, ...patch } : it
              ),
            }
          : r
      )
    );
  }

  function salvar() {
    setErro(null);
    setSucesso(null);

    if (!titulo.trim()) {
      setErro("Informe um título para o plano.");
      return;
    }

    const caloriasNum = caloriasAlvo.trim() ? Number(caloriasAlvo) : undefined;
    if (caloriasNum != null && (Number.isNaN(caloriasNum) || caloriasNum < 0)) {
      setErro("Calorias-alvo inválidas.");
      return;
    }

    const dados: DadosPlano = {
      titulo: titulo.trim(),
      objetivo: objetivo.trim() || undefined,
      caloriasAlvo: caloriasNum,
      observacoes: observacoes.trim() || undefined,
      refeicoes: paraPayload(refeicoes),
    };

    startTransition(async () => {
      if (modoEdicao && planoId) {
        const r = await atualizarPlano(pacienteId, planoId, dados);
        if (r.erro) {
          setErro(r.erro);
          return;
        }
        setSucesso("Plano salvo com sucesso.");
        router.refresh();
      } else {
        const r = await criarPlano(pacienteId, dados);
        if (r.erro) {
          setErro(r.erro);
          return;
        }
        if (r.novoPlano) {
          router.push(
            `/planos/${r.novoPlano.id}?pacienteId=${r.novoPlano.pacienteId}`
          );
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {modoEdicao && jaAprovado && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Este plano já está aprovado.</strong> As alterações salvas
          ficam imediatamente visíveis ao paciente na PWA (o plano continua
          aprovado). Se quiser revisar sem que o paciente veja, duplique o plano
          e edite a cópia (rascunho).
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título do plano *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Plano de emagrecimento — fase 1"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input
                id="objetivo"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ex.: Reduzir gordura corporal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caloriasAlvo">Calorias-alvo (kcal)</Label>
              <Input
                id="caloriasAlvo"
                type="number"
                min={0}
                value={caloriasAlvo}
                onChange={(e) => setCaloriasAlvo(e.target.value)}
                placeholder="Ex.: 1800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              placeholder="Orientações gerais, restrições, etc."
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {refeicoes.map((refeicao) => (
          <Card key={refeicao.localId}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Nome da refeição</Label>
                  <Input
                    value={refeicao.nome}
                    onChange={(e) =>
                      atualizarRefeicao(refeicao.localId, "nome", e.target.value)
                    }
                    placeholder="Ex.: Café da manhã"
                  />
                </div>
                <div className="w-32 space-y-1.5">
                  <Label>Horário</Label>
                  <Input
                    value={refeicao.horario}
                    onChange={(e) =>
                      atualizarRefeicao(refeicao.localId, "horario", e.target.value)
                    }
                    placeholder="08:00"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerRefeicao(refeicao.localId)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>

              <div className="space-y-3">
                {refeicao.itens.map((item) => (
                  <ItemEditor
                    key={item.localId}
                    item={item}
                    onChange={(patch) =>
                      atualizarItem(refeicao.localId, item.localId, patch)
                    }
                    onRemove={() => removerItem(refeicao.localId, item.localId)}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adicionarItem(refeicao.localId)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar item
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={adicionarRefeicao}
        >
          <Plus className="h-4 w-4" />
          Adicionar refeição
        </Button>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {sucesso && <p className="text-sm text-emerald-600">{sucesso}</p>}

      <div className="flex gap-2">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : "Criar plano"}
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

      <p className="text-xs text-muted-foreground">
        Criar ou editar não aprova o plano. Ele só fica visível ao paciente após
        a aprovação explícita (botão Aprovar na tela do plano).
      </p>
    </div>
  );
}

// Linha de item: busca TACO com debounce + quantidade em gramas + anotação
// livre. Ao selecionar um alimento, grava alimentoCodigo e preenche a descrição
// com a descrição da TACO. Sem código = anotação livre (não entra no cálculo).
function ItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: ItemEstado;
  onChange: (patch: Partial<ItemEstado>) => void;
  onRemove: () => void;
}) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<AlimentoTaco[]>([]);
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [, startBusca] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startBusca(async () => {
        const r = await buscarAlimentos(termo);
        setResultados(r.alimentos ?? []);
        setBuscando(false);
        setAberto(true);
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termo]);

  function selecionar(alimento: AlimentoTaco) {
    onChange({
      alimentoCodigo: alimento.codigo,
      descricao: alimento.descricao,
    });
    setTermo("");
    setResultados([]);
    setAberto(false);
  }

  function limparVinculo() {
    onChange({ alimentoCodigo: undefined });
  }

  const temCodigo = item.alimentoCodigo != null;

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          {temCodigo ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-xs text-brand-700">
                TACO #{item.alimentoCodigo}
              </span>
              <span className="text-sm font-medium">{item.descricao}</span>
              <button
                type="button"
                onClick={limparVinculo}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remover vínculo com a TACO"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  onFocus={() => resultados.length && setAberto(true)}
                  placeholder="Buscar alimento na TACO..."
                />
              </div>
              {aberto && termo.trim() && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white shadow-md">
                  {buscando && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Buscando...
                    </p>
                  )}
                  {!buscando && resultados.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum alimento encontrado.
                    </p>
                  )}
                  {resultados.map((a) => (
                    <button
                      key={a.codigo}
                      type="button"
                      onClick={() => selecionar(a)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50"
                    >
                      <span>{a.descricao}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {Math.round(a.kcal ?? 0)} kcal/100g
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!temCodigo && (
            <Input
              value={item.descricao}
              onChange={(e) => onChange({ descricao: e.target.value })}
              placeholder="Ou digite uma anotação livre (não calculada)"
            />
          )}
        </div>

        <div className="w-28 space-y-1">
          <Input
            type="number"
            min={0}
            value={item.quantidadeGramas != null ? String(item.quantidadeGramas) : ""}
            onChange={(e) =>
              onChange({
                quantidadeGramas: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            placeholder="gramas"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive"
          aria-label="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {temCodigo && item.quantidadeGramas == null && (
        <p className="mt-1 text-xs text-amber-600">
          Informe a quantidade em gramas para este item entrar no cálculo.
        </p>
      )}
    </div>
  );
}
