import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MobileTabBar as KitMobileTabBar } from 'overtime-kit';
import { useAuth } from '../providers/AuthContext';

/** Destinos del organizador. La barra en sí vive en overtime-kit; se oculta desde `xl`. */
export default function MobileTabBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!isAuthenticated) return null;

  return (
    <KitMobileTabBar
      LinkComponent={Link}
      currentPath={pathname}
      ocultarDesde="xl"
      tabs={[
        { to: '/dashboard', label: 'Inicio', icon: '🏠' },
        { to: '/competencias', label: 'Comp.', icon: '🏆' },
        { to: '/partidos', label: 'Partidos', icon: '📅' },
        { to: '/notificaciones', label: 'Avisos', icon: '🔔' },
      ]}
      more={[
        { to: '/organizacion', label: 'Organización', icon: '🏢' },
        { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
        { to: '/perfil', label: 'Perfil', icon: '👤' },
      ]}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
}
