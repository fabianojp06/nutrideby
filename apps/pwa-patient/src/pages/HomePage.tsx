import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalorieRing } from '@/components/CalorieRing';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { fetchDailyProgress, getMinhaAnamnese, DailyProgress } from '@/services/api';
import './HomePage.css';

export function HomePage() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  // Card de entrada da anamnese: aparece enquanto o paciente ainda não teve a
  // anamnese incorporada pela nutricionista (nunca respondeu ou pendente).
  const [mostrarAnamnese, setMostrarAnamnese] = useState(false);

  useEffect(() => {
    fetchDailyProgress().then(setProgress);
    getMinhaAnamnese()
      .then((a) => setMostrarAnamnese(!a || a.status === 'PENDENTE_REVISAO'))
      .catch(() => setMostrarAnamnese(false));
  }, []);

  if (!progress) {
    return <div className="screen home-page">Carregando...</div>;
  }

  const nextMeal = progress.nextMeals[0];

  return (
    <div className="screen home-page">
      <header className="home-header">
        <div className="home-header__name">Olá, {name ?? 'Paciente'}</div>
        <ThemeToggle />
      </header>

      {mostrarAnamnese && (
        <section className="section">
          <div className="action">
            <span>Complete sua anamnese para a nutricionista</span>
            <button className="pill-btn" onClick={() => navigate('/anamnese')}>
              Preencher
            </button>
          </div>
        </section>
      )}

      <section className="hero">
        <CalorieRing
          kcalRemaining={progress.kcalRemaining}
          kcalGoal={progress.kcalGoal}
          kcalConsumed={progress.kcalConsumed}
        />
      </section>

      <div className="macros">
        <div className="macro-tile">
          <b>{progress.macros.protein}g</b>
          <span>Proteína</span>
        </div>
        <div className="macro-tile">
          <b>{progress.macros.carbs}g</b>
          <span>Carbo</span>
        </div>
        <div className="macro-tile">
          <b>{progress.macros.fat}g</b>
          <span>Gordura</span>
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
        <div className="info-card" onClick={() => navigate('/plano')}>
          <div className="info-card__body">
            <h3>Próxima refeição</h3>
            {nextMeal ? (
              <div className="info-card__value">
                <span className="info-card__time">{nextMeal.time}</span>
                <span className="info-card__label">{nextMeal.label}</span>
              </div>
            ) : (
              <div className="info-card__value">
                <span className="info-card__label">Sem refeições no horário.</span>
              </div>
            )}
          </div>
          <span className="pill-btn" role="button">
            Ver plano
          </span>
        </div>
      </section>

      <section className="section">
        <div className="info-card" onClick={() => navigate('/evolucao')}>
          <div className="info-card__body">
            <h3>Peso</h3>
            <div className="info-card__value">
              <span className="info-card__label">
                {progress.weight.current.toLocaleString('pt-BR')} kg
              </span>
              <span className="delta-down">
                ▼ {Math.abs(progress.weight.deltaLastWeek).toLocaleString('pt-BR')}kg
              </span>
            </div>
          </div>
          <span className="pill-btn" role="button">
            Registrar
          </span>
        </div>
      </section>

      <section className="section">
        <div className="info-card" onClick={() => navigate('/diario')}>
          <div className="info-card__body">
            <h3>Diário</h3>
            <div className="info-card__value">
              <span className="info-card__label">
                {progress.diaryEntriesToday === 0
                  ? 'Nenhuma refeição registrada hoje'
                  : `${progress.diaryEntriesToday} refeição(ões) registradas hoje`}
              </span>
            </div>
          </div>
          <span className="pill-btn" role="button">
            + Registrar
          </span>
        </div>
      </section>
    </div>
  );
}
