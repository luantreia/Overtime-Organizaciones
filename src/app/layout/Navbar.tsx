import { NavLink } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import OrganizationSelector from '../../features/organizacion/components/OrganizationSelector';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/organizacion', label: 'Organización' },
  { to: '/competencias', label: 'Competencias' },
  { to: '/partidos', label: 'Partidos' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/notificaciones', label: 'Notificaciones' },
  { to: '/perfil', label: 'Perfil' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-slate-100'}`;

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-white shadow shadow-brand-500/40">
            🏢
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">Overtime Organizaciones</p>
            <p className="text-xs text-slate-500">Panel de Organizaciones y Competencias</p>
          </div>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium text-slate-600 xl:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-1 justify-end xl:flex-none">
          <OrganizationSelector />
          {!isAuthenticated && (
            <NavLink to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
              Iniciar sesión
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}


