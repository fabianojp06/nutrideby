import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anamnese,
  AnamneseInput,
  enviarAnamnese,
  getMinhaAnamnese,
} from '@/services/api';
import './AnamnesePage.css';

// Item 20 — anamnese de pré-consulta auto-declarada pelo paciente.
// É dado de saúde AUTO-DECLARADO: a UI deixa claro que é o relato do próprio
// paciente para a nutricionista revisar. Sem auto-diagnóstico — perguntas
// sobre condições "já diagnosticadas por um médico". Campos sensíveis
// (álcool, tabaco, hábito intestinal, gestação) são opcionais.

type CampoTexto = { key: keyof AnamneseInput; label: string; placeholder?: string; multiline?: boolean };

type Secao = { titulo: string; descricao?: string; campos: CampoTexto[] };

const SECOES: Secao[] = [
  {
    titulo: 'Seu objetivo',
    descricao: 'O que você espera do acompanhamento nutricional.',
    campos: [
      { key: 'objetivo', label: 'Qual é o seu principal objetivo?', placeholder: 'Ex.: emagrecer, ganhar massa, melhorar a alimentação', multiline: true },
      { key: 'queixaPrincipal', label: 'Há algo que mais te incomoda hoje? (opcional)', placeholder: 'Ex.: cansaço, má digestão', multiline: true },
    ],
  },
  {
    titulo: 'Histórico de saúde',
    descricao: 'Informe apenas o que já foi diagnosticado por um médico. Nada aqui é diagnóstico — é o seu relato para a nutricionista avaliar.',
    campos: [
      { key: 'historicoClinico', label: 'Condições já diagnosticadas por um médico (opcional)', placeholder: 'Ex.: hipertensão, diabetes', multiline: true },
      { key: 'historicoFamiliar', label: 'Condições diagnosticadas na sua família (opcional)', placeholder: 'Ex.: diabetes nos pais', multiline: true },
      { key: 'usoMedicamentos', label: 'Medicamentos que você usa (opcional)', placeholder: 'Nome e para quê, se souber', multiline: true },
      { key: 'suplementos', label: 'Suplementos que você usa (opcional)', placeholder: 'Ex.: whey, creatina, vitamina D', multiline: true },
      { key: 'alergias', label: 'Alergias alimentares (opcional)', placeholder: 'Ex.: amendoim, frutos do mar' },
      { key: 'intolerancias', label: 'Intolerâncias alimentares (opcional)', placeholder: 'Ex.: lactose, glúten' },
    ],
  },
  {
    titulo: 'Hábitos e rotina',
    descricao: 'Como é o seu dia a dia com a alimentação e atividades. Os campos abaixo são todos opcionais.',
    campos: [
      { key: 'habitosAlimentares', label: 'Como é a sua alimentação hoje? (opcional)', placeholder: 'O que costuma comer no dia', multiline: true },
      { key: 'rotinaRefeicoes', label: 'Rotina de refeições (opcional)', placeholder: 'Horários e onde costuma comer', multiline: true },
      { key: 'preferenciasAversoes', label: 'Preferências e aversões alimentares (opcional)', placeholder: 'O que gosta e o que não come', multiline: true },
      { key: 'consumoAgua', label: 'Consumo de água por dia (opcional)', placeholder: 'Ex.: cerca de 1,5 litro' },
      { key: 'nivelAtividadeFisica', label: 'Nível de atividade física (opcional)', placeholder: 'Ex.: sedentário, moderado, ativo' },
      { key: 'praticaExercicio', label: 'Pratica exercício? Qual e com que frequência? (opcional)', placeholder: 'Ex.: musculação 3x por semana', multiline: true },
      { key: 'sono', label: 'Como está o seu sono? (opcional)', placeholder: 'Ex.: durmo cerca de 6h, sono leve' },
      { key: 'habitoIntestinal', label: 'Hábito intestinal (opcional)', placeholder: 'Se quiser compartilhar' },
      { key: 'consumoAlcool', label: 'Consumo de bebida alcoólica (opcional)', placeholder: 'Se quiser compartilhar' },
      { key: 'tabagismo', label: 'Tabagismo (opcional)', placeholder: 'Se quiser compartilhar' },
      { key: 'gestacaoLactacao', label: 'Gestação ou amamentação (opcional)', placeholder: 'Se aplicável' },
      { key: 'observacoesGerais', label: 'Algo mais que queira contar? (opcional)', placeholder: 'Espaço livre', multiline: true },
    ],
  },
];

type FormState = Record<string, string>;

function anamneseParaForm(a: Anamnese | null): FormState {
  const state: FormState = {};
  if (!a) return state;
  for (const secao of SECOES) {
    for (const campo of secao.campos) {
      const valor = a[campo.key as keyof Anamnese];
      if (typeof valor === 'string') state[campo.key] = valor;
    }
  }
  state.pesoDeclaradoKg = a.pesoDeclaradoKg ?? '';
  state.alturaDeclaradaCm = a.alturaDeclaradaCm ?? '';
  return state;
}

function montarPayload(form: FormState): AnamneseInput {
  const payload: AnamneseInput = {};
  for (const secao of SECOES) {
    for (const campo of secao.campos) {
      const valor = form[campo.key]?.trim();
      if (valor) (payload as Record<string, unknown>)[campo.key] = valor;
    }
  }
  const peso = parseFloat((form.pesoDeclaradoKg ?? '').replace(',', '.'));
  const altura = parseFloat((form.alturaDeclaradaCm ?? '').replace(',', '.'));
  if (!Number.isNaN(peso)) payload.pesoDeclaradoKg = peso;
  if (!Number.isNaN(altura)) payload.alturaDeclaradaCm = altura;
  return payload;
}

export function AnamnesePage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    getMinhaAnamnese()
      .then((a) => {
        setAnamnese(a);
        setForm(anamneseParaForm(a));
      })
      .catch(() => setErro('Não foi possível carregar sua anamnese. Tente novamente.'))
      .finally(() => setCarregando(false));
  }, []);

  const incorporada = anamnese?.status === 'INCORPORADA';
  const pendente = anamnese?.status === 'PENDENTE_REVISAO';
  const mostrarFormulario = useMemo(
    () => !incorporada && (!anamnese || editando),
    [incorporada, anamnese, editando],
  );

  function setCampo(key: string, valor: string) {
    setForm((prev) => ({ ...prev, [key]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const atualizada = await enviarAnamnese(montarPayload(form));
      setAnamnese(atualizada);
      setForm(anamneseParaForm(atualizada));
      setEditando(false);
      setSucesso(true);
    } catch {
      setErro('Não foi possível enviar sua anamnese. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="screen anamnese-page">Carregando...</div>;
  }

  return (
    <div className="screen anamnese-page">
      <header className="page-header">
        <h1>Anamnese de pré-consulta</h1>
      </header>

      <div className="ia-disclaimer" role="note">
        <span className="ia-disclaimer__icon" aria-hidden="true">
          i
        </span>
        <span>
          Estas informações são o seu próprio relato. Sua nutricionista vai revisar
          tudo na consulta. Nada aqui é diagnóstico — responda apenas o que quiser.
        </span>
      </div>

      {incorporada && (
        <section className="section">
          <div className="anamnese-status anamnese-status--ok">
            Revisado pela sua nutricionista. Estas informações já foram
            incorporadas ao seu acompanhamento.
          </div>
          <ResumoAnamnese anamnese={anamnese!} />
          <button className="fab anamnese-voltar" onClick={() => navigate('/')}>
            Voltar ao início
          </button>
        </section>
      )}

      {pendente && !editando && (
        <section className="section">
          <div className="anamnese-status">
            Enviado — sua nutricionista vai revisar. Você pode editar e reenviar
            enquanto não for revisado.
          </div>
          <ResumoAnamnese anamnese={anamnese!} />
          <div className="anamnese-acoes">
            <button
              className="fab"
              onClick={() => {
                setSucesso(false);
                setEditando(true);
              }}
            >
              Editar respostas
            </button>
          </div>
        </section>
      )}

      {mostrarFormulario && (
        <form className="anamnese-form" onSubmit={handleSubmit}>
          {SECOES.map((secao) => (
            <section className="section" key={secao.titulo}>
              <h3>{secao.titulo}</h3>
              {secao.descricao && <p className="anamnese-desc">{secao.descricao}</p>}
              {secao.campos.map((campo) => (
                <label className="anamnese-campo" key={String(campo.key)}>
                  <span>{campo.label}</span>
                  {campo.multiline ? (
                    <textarea
                      rows={2}
                      placeholder={campo.placeholder}
                      value={form[campo.key] ?? ''}
                      onChange={(e) => setCampo(String(campo.key), e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={campo.placeholder}
                      value={form[campo.key] ?? ''}
                      onChange={(e) => setCampo(String(campo.key), e.target.value)}
                    />
                  )}
                </label>
              ))}
            </section>
          ))}

          <section className="section">
            <h3>Medidas (opcional)</h3>
            <p className="anamnese-desc">
              Informado por você (provisório). A medida oficial é aferida pela sua
              nutricionista.
            </p>
            <div className="anamnese-medidas">
              <label className="anamnese-campo">
                <span>Peso (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="Ex.: 72.5"
                  value={form.pesoDeclaradoKg ?? ''}
                  onChange={(e) => setCampo('pesoDeclaradoKg', e.target.value)}
                />
              </label>
              <label className="anamnese-campo">
                <span>Altura (cm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="Ex.: 170"
                  value={form.alturaDeclaradaCm ?? ''}
                  onChange={(e) => setCampo('alturaDeclaradaCm', e.target.value)}
                />
              </label>
            </div>
          </section>

          {erro && <div className="anamnese-feedback anamnese-feedback--erro">{erro}</div>}

          <div className="section anamnese-acoes">
            <button className="fab anamnese-enviar" type="submit" disabled={salvando}>
              {salvando ? 'Enviando...' : 'Enviar para minha nutricionista'}
            </button>
            {pendente && (
              <button
                type="button"
                className="anamnese-cancelar"
                onClick={() => {
                  setForm(anamneseParaForm(anamnese));
                  setEditando(false);
                }}
                disabled={salvando}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {sucesso && !editando && (
        <div className="section">
          <div className="anamnese-feedback anamnese-feedback--ok">
            Anamnese enviada com sucesso.
          </div>
        </div>
      )}

      {erro && !mostrarFormulario && (
        <div className="section">
          <div className="anamnese-feedback anamnese-feedback--erro">{erro}</div>
        </div>
      )}
    </div>
  );
}

function ResumoAnamnese({ anamnese }: { anamnese: Anamnese }) {
  const itens: { label: string; valor: string }[] = [];
  for (const secao of SECOES) {
    for (const campo of secao.campos) {
      const valor = anamnese[campo.key as keyof Anamnese];
      if (typeof valor === 'string' && valor.trim()) {
        itens.push({ label: campo.label, valor });
      }
    }
  }
  if (anamnese.pesoDeclaradoKg) itens.push({ label: 'Peso informado (provisório)', valor: `${anamnese.pesoDeclaradoKg} kg` });
  if (anamnese.alturaDeclaradaCm) itens.push({ label: 'Altura informada (provisória)', valor: `${anamnese.alturaDeclaradaCm} cm` });

  if (itens.length === 0) {
    return <p className="anamnese-desc">Nenhuma resposta preenchida.</p>;
  }

  return (
    <ul className="anamnese-resumo">
      {itens.map((item) => (
        <li key={item.label}>
          <span className="anamnese-resumo__label">{item.label}</span>
          <span className="anamnese-resumo__valor">{item.valor}</span>
        </li>
      ))}
    </ul>
  );
}
