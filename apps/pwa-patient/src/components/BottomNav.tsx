import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const ITEMS = [
  { to: '/', label: 'Início' },
  { to: '/plano', label: 'Plano' },
  { to: '/diario', label: 'Diário' },
  { to: '/evolucao', label: 'Evolução' },
  { to: '/perfil', label: 'Perfil' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
