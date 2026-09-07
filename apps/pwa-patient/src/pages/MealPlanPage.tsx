import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchMealPlan, MealPlan } from '@/services/api';
import './MealPlanPage.css';

type State =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; plano: MealPlan };

export function MealPlanPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    fetchMealPlan()
      .then((plano) =>
        setState(plano ? { status: 'ready', plano } : { status: 'empty' }),
      )
      .catch(() => setState({ status: 'empty' }));
  }, []);

  return (
    <div className="screen meal-plan-page">
      <header className="mp-topbar">
        <h1>Meu plano</h1>
      </header>

      {state.status === 'loading' && (
        <p className="mp-state">Carregando seu plano…</p>
      )}

      {state.status === 'empty' && (
        <div className="mp-state mp-state--empty">
          <div className="mp-state__icon" aria-hidden="true">
            🥗
          </div>
          <p>Você ainda não tem um plano alimentar aprovado.</p>
          <span>
            Assim que sua nutricionista revisar e liberar seu plano, ele aparece
            aqui.
          </span>
        </div>
      )}

      {state.status === 'ready' && <PlanoView plano={state.plano} />}
    </div>
  );
}

function PlanoView({ plano }: { plano: MealPlan }) {
  return (
    <>
      <section className="mp-hero">
        <div className="mp-hero__title">{plano.titulo}</div>
        <div className="mp-hero__kcal">
          <b>{plano.totalKcal.toLocaleString('pt-BR')}</b>
          <span>kcal / dia</span>
        </div>
        <div className="mp-hero__macros">
          <div>
            <b>{plano.macros.protein}g</b>
            <span>Proteína</span>
          </div>
          <div>
            <b>{plano.macros.carbs}g</b>
            <span>Carbo</span>
          </div>
          <div>
            <b>{plano.macros.fat}g</b>
            <span>Gordura</span>
          </div>
        </div>
      </section>

      {plano.origem === 'ia_rascunho' && (
        <div className="mp-note" role="note">
          <span className="mp-note__icon" aria-hidden="true">
            ✓
          </span>
          <span>
            Elaborado com apoio de IA e <strong>revisado e aprovado</strong> pela
            sua nutricionista.
          </span>
        </div>
      )}

      <div className="mp-meals">
        {plano.refeicoes.map((refeicao, i) => (
          <article className="mp-meal" key={`${refeicao.nome}-${i}`}>
            <div className="mp-meal__head">
              <div className="mp-meal__when">
                {refeicao.horario && (
                  <span className="mp-meal__time">{refeicao.horario}</span>
                )}
                <h2>{refeicao.nome}</h2>
              </div>
              <span className="mp-meal__kcal">{refeicao.totalKcal} kcal</span>
            </div>

            {refeicao.itens.length === 0 ? (
              <p className="mp-meal__empty">Sem itens registrados.</p>
            ) : (
              <ul className="mp-meal__items">
                {refeicao.itens.map((item, j) => (
                  <li key={j}>
                    <span className="mp-item__name">{item.descricao}</span>
                    {(item.quantidadeGramas != null || item.kcal != null) && (
                      <span className="mp-item__meta">
                        {[
                          item.quantidadeGramas != null
                            ? `${item.quantidadeGramas} g`
                            : null,
                          item.kcal != null ? `${item.kcal} kcal` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {plano.observacoes && (
        <section className="mp-obs">
          <h3>Observações da nutricionista</h3>
          <div className="mp-md">
            <ReactMarkdown>{plano.observacoes}</ReactMarkdown>
          </div>
        </section>
      )}
    </>
  );
}
