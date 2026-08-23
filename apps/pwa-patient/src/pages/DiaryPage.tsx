import { FormEvent, useEffect, useState } from 'react';
import { fetchDiaryEntries, registerMealEntry, MealEntry } from '@/services/mockApi';
import './DiaryPage.css';

// Fase 0: registro manual (texto/foto), sem análise de IA sobre a refeição.
export function DiaryPage() {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDiaryEntries().then(setEntries);
  }, []);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim() && !photoUrl) return;
    setSaving(true);
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const entry = await registerMealEntry({ time, description, photoUrl });
    setEntries((prev) => [entry, ...prev]);
    setDescription('');
    setPhotoUrl(undefined);
    setSaving(false);
  }

  return (
    <div className="screen diary-page">
      <header className="page-header">
        <h1>Diário Alimentar</h1>
      </header>

      <form className="diary-form section" onSubmit={handleSubmit}>
        <textarea
          placeholder="Descreva o que você comeu..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="diary-form__row">
          <label className="photo-input">
            {photoUrl ? 'Foto selecionada' : '+ Foto'}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} hidden />
          </label>
          <button className="fab" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
        {photoUrl && <img className="diary-form__preview" src={photoUrl} alt="Prévia da refeição" />}
      </form>

      <section className="section">
        <h3>Hoje</h3>
        {entries.length === 0 ? (
          <div className="action">
            <span>Nenhuma refeição registrada hoje</span>
          </div>
        ) : (
          <ul className="diary-list">
            {entries.map((entry) => (
              <li key={entry.id} className="diary-list__item">
                {entry.photoUrl && <img src={entry.photoUrl} alt="Refeição" />}
                <div>
                  <div className="diary-list__time">{entry.time}</div>
                  <div className="diary-list__desc">{entry.description || 'Sem descrição'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
