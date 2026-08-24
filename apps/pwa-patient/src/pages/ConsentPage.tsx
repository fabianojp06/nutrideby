import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsent } from '@/hooks/useConsent';
import { fetchPendingConsentTerm, ConsentTerm } from '@/services/api';
import './ConsentPage.css';

// Tela bloqueante: nenhuma outra rota é acessível antes da aceitação
// explícita deste Termo de Consentimento (obrigação de LGPD, ver CLAUDE.md).
export function ConsentPage() {
  const { accept } = useConsent();
  const navigate = useNavigate();
  const [term, setTerm] = useState<ConsentTerm | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchPendingConsentTerm().then(setTerm);
  }, []);

  async function handleAccept() {
    if (!term) return;
    setAccepting(true);
    await accept(term.id);
    navigate('/', { replace: true });
  }

  if (!term) {
    return <div className="centered-screen">Carregando termo...</div>;
  }

  return (
    <div className="centered-screen">
      <div className="consent-card">
        <h1>{term.title}</h1>
        <p className="consent-card__version">Versão {term.version}</p>
        <div className="consent-card__body">{term.body}</div>
        <button className="btn-primary" onClick={handleAccept} disabled={accepting}>
          {accepting ? 'Registrando...' : 'Li e aceito o termo'}
        </button>
      </div>
    </div>
  );
}
