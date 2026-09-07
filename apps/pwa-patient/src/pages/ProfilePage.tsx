import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import './ProfilePage.css';

export function ProfilePage() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="screen profile-page">
      <header className="page-header">
        <h1>Perfil</h1>
      </header>

      <section className="section profile-card">
        <div className="profile-card__avatar" />
        <div className="profile-card__name">{name ?? 'Paciente'}</div>
      </section>

      <section className="section">
        <h3 className="profile-section-title">Aparência</h3>
        <ThemeToggle variant="row" />
      </section>

      <section className="section">
        <div className="action">
          <span>Privacidade e Termo de Consentimento</span>
        </div>
        <div className="action">
          <span>Notificações</span>
        </div>
        <div className="action">
          <span>Suporte</span>
        </div>
      </section>

      <section className="section">
        <button className="btn-secondary" onClick={handleLogout}>
          Sair
        </button>
      </section>
    </div>
  );
}
