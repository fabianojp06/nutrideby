import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalorieRing } from '@/components/CalorieRing';
import { useAuth } from '@/hooks/useAuth';
import { fetchDailyProgress, DailyProgress } from '@/services/api';
import './HomePage.css';

export function HomePage() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<DailyProgress | null>(null);

  useEffect(() => {
    fetchDailyProgress().then(setProgress);
  }, []);

  if (!progress) {
    return <div className="screen home-page">Carregando...</div>;
  }

  return (
    <div className="screen home-page">
      <header className="home-header">
        <div className="home-header__name">Olá, {name ?? 'Paciente'}</div>
        <div className="home-header__avatar" />
      </header>

      <CalorieRing
        kcalRemaining={progress.kcalRemaining}
        kcalGoal={progress.kcalGoal}
        kcalConsumed={progress.kcalConsumed}
      />

      <div className="macros">
        <div>
          <b>{progress.macros.protein}g</b>Proteína
        </div>
        <div>
          <b>{progress.macros.carbs}g</b>Carbo
        </div>
        <div>
          <b>{progress.macros.fat}g</b>Gordura
        </div>
      </div>

      {progress.planOrigin === 'ia_rascunho' && (
        <div className="ia-disclaimer" role="note">
          <span className="ia-disclaimer__icon" aria-hidden="true">
            ✓
          </span>
          <span>Plano revisado e aprovado pela sua nutricionista.</span>
        </div>
      )}

      <section className="section">
        <h3>Próximas refeições</h3>
        <div className="pill-list">
          {progress.nextMeals.map((meal) => (
            <div className="pill" key={meal.time}>
              <div className="pill__t">{meal.time}</div>
              <div className="pill__n">{meal.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h3>Peso</h3>
        <div className="action">
          <span>
            {progress.weight.current.toLocaleString('pt-BR')} kg{' '}
            <span className="delta-down">
              ▼ {Math.abs(progress.weight.deltaLastWeek).toLocaleString('pt-BR')}kg
            </span>
          </span>
          <button className="fab" onClick={() => navigate('/evolucao')}>
            Registrar
          </button>
        </div>
      </section>

      <section className="section">
        <h3>Diário</h3>
        <div className="action">
          <span>
            {progress.diaryEntriesToday === 0
              ? 'Nenhuma refeição registrada hoje'
              : `${progress.diaryEntriesToday} refeição(ões) registradas hoje`}
          </span>
          <button className="fab" onClick={() => navigate('/diario')}>
            + Registrar
          </button>
        </div>
      </section>
    </div>
  );
}
