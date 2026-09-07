import { useEffect, useState } from 'react';
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
      <header className="page-header">
        <h1>Meu plano</h1>
      </header>

      {state.status === 'loading' && <p className="mp-muted">Carregando...</p>}

      {state.status === 'empty' && (
        <p className="mp-muted">
          Você ainda não tem um plano alimentar aprovado pela sua nutricionista.
        </p>
      )}

      {state.status === 'ready' && <PlanoView plano={state.plano} />}
    </div>
  );
}

function PlanoView({ plano }: { plano: MealPlan }) {
  return (
    <>
      <section className="section">
        <div className="mp-title">{plano.titulo}</div>
        <div className="mp-summary">
          <span>
            <b>{plano.totalKcal}</b> kcal/dia
          </span>
          <span>P {plano.macros.protein}g</span>
          <span>C {plano.macros.carbs}g</span>
          <span>G {plano.macros.fat}g</span>
        </div>
      </section>

      {plano.origem === 'ia_rascunho' && (
        <div className="ia-disclaimer" role="note">
          <span className="ia-disclaimer__icon" aria-hidden="true">
            ✓
          </span>
          <span>
            Plano elaborado com apoio de IA e revisado e aprovado pela sua
            nutricionista.
          </span>
        </div>
      )}

      {plano.refeicoes.map((refeicao, i) => (
        <section className="section" key={`${refeicao.nome}-${i}`}>
          <div className="mp-meal-head">
            <h3>
              {refeicao.horario ? `${refeicao.horario} · ` : ''}
              {refeicao.nome}
            </h3>
            <span className="mp-meal-kcal">{refeicao.totalKcal} kcal</span>
          </div>
          <ul className="mp-items">
            {refeicao.itens.length === 0 && (
              <li className="mp-muted">Sem itens.</li>
            )}
            {refeicao.itens.map((item, j) => (
              <li key={j}>
                <span className="mp-item-name">{item.descricao}</span>
                <span className="mp-item-qty">
                  {item.quantidadeGramas != null ? `${item.quantidadeGramas} g` : ''}
                  {item.kcal != null ? ` · ${item.kcal} kcal` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {plano.observacoes && (
        <section className="section">
          <h3>Observações da nutricionista</h3>
          <p className="mp-obs">{plano.observacoes}</p>
        </section>
      )}
    </>
  );
}
