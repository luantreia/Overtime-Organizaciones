import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';

const primaryTabs = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/competencias', label: 'Comp.', icon: '🏆' },
  { to: '/partidos', label: 'Partidos', icon: '📅' },
  { to: '/notificaciones', label: 'Avisos', icon: '🔔' },
];

const moreLinks = [
  { to: '/organizacion', label: 'Organización', icon: '🏢' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
];

export default function MobileTabBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isAuthenticated) return null;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold ${
      isActive ? 'text-brand-600' : 'text-slate-400'
    }`;

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 xl:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg xl:hidden">
          {moreLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <span className="text-base">🚪</span>
            Cerrar sesión
          </button>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] xl:hidden"
        aria-label="Navegación principal"
      >
        {primaryTabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={tabClass}>
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold ${
            moreOpen ? 'text-brand-600' : 'text-slate-400'
          }`}
        >
          <span className="text-lg leading-none">⋯</span>
          Más
        </button>
      </nav>
    </>
  );
}
