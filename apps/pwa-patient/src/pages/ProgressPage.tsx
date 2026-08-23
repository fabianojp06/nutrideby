import { FormEvent, useEffect, useState } from 'react';
import { fetchWeightHistory, registerWeight, WeightEntry } from '@/services/mockApi';
import './ProgressPage.css';

export function ProgressPage() {
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWeightHistory().then(setHistory);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const kg = Number(newWeight.replace(',', '.'));
    if (!kg) return;
    setSaving(true);
    const entry = await registerWeight(kg);
    setHistory((prev) => [...prev, entry]);
    setNewWeight('');
    setSaving(false);
  }

  const values = history.map((h) => h.kg);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  return (
    <div className="screen progress-page">
      <header className="page-header">
        <h1>Evolução</h1>
      </header>

      <section className="section">
        <h3>Peso</h3>
        <div className="weight-chart">
          <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="weight-chart__svg">
            <polyline
              fill="none"
              stroke="#3fa66c"
              strokeWidth="3"
              points={history
                .map((entry, i) => {
                  const x = (i / Math.max(history.length - 1, 1)) * 300;
                  const y = 110 - ((entry.kg - min) / range) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
          <div className="weight-chart__labels">
            {history.map((entry) => (
              <span key={entry.date}>{entry.date.slice(5)}</span>
            ))}
          </div>
        </div>
      </section>

      <form className="section weight-form" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Novo peso (kg)"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
        />
        <button className="fab" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Registrar'}
        </button>
      </form>
    </div>
  );
}
