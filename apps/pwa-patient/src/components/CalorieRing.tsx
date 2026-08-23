import './CalorieRing.css';

interface CalorieRingProps {
  kcalRemaining: number;
  kcalGoal: number;
  kcalConsumed: number;
}

export function CalorieRing({ kcalRemaining, kcalGoal, kcalConsumed }: CalorieRingProps) {
  const progressDeg = Math.min(360, Math.round((kcalConsumed / kcalGoal) * 360));

  return (
    <div className="ring-wrap">
      <div
        className="ring"
        style={{
          background: `conic-gradient(var(--accent) 0deg ${progressDeg}deg, var(--border) ${progressDeg}deg 360deg)`,
        }}
      >
        <div className="ring__center">
          <div className="ring__kcal">{kcalRemaining}</div>
          <div className="ring__label">kcal restantes</div>
        </div>
      </div>
    </div>
  );
}
