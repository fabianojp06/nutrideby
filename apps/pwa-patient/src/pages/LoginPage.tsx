import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import './LoginPage.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Não foi possível entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__logo">NutriDeby</div>
        <p className="login-card__subtitle">Acompanhamento nutricional</p>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="login-card__error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
