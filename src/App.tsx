import { Routes, Route, Navigate } from 'react-router-dom';
import PerfilPage from './features/perfil/pages/PerfilPage';
import LoginPage from './features/auth/pages/LoginPage';
import ProtectedRoute from './app/routes/ProtectedRoute';
import OrganizacionPage from './features/organizacion/pages/OrganizacionPage';
import Navbar from './app/layout/Navbar';
import MobileTabBar from './app/layout/MobileTabBar';
import DashboardOrgPage from './features/dashboard/pages/DashboardOrgPage';
import PartidosPage from './features/partidos/pages/PartidosPage';
import EstadisticasOrgPage from './features/estadisticas/pages/EstadisticasOrgPage';
import NotificacionesOrgPage from './features/notificaciones/pages/NotificacionesOrgPage';
import CompetenciasOrgPage from './features/competencias/pages/CompetenciasOrgPage';
import CompetenciaDetallePage from './features/competencias/pages/CompetenciaDetallePage';

const App = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 pb-24 xl:pb-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Una sola guarda para todas las rutas privadas: cada página nueva entra como hija acá. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardOrgPage />} />
            <Route path="/organizacion" element={<OrganizacionPage />} />
            <Route path="/competencias" element={<CompetenciasOrgPage />} />
            <Route path="/competencias/:id" element={<CompetenciaDetallePage />} />
            <Route path="/partidos" element={<PartidosPage />} />
            <Route path="/estadisticas" element={<EstadisticasOrgPage />} />
            <Route path="/notificaciones" element={<NotificacionesOrgPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="hidden border-t border-slate-200 bg-white/60 py-4 xl:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Overtime Dodgeball</span>
          <span>Gestión diaria para Organizadores y Staff</span>
        </div>
      </footer>

      <MobileTabBar />
    </div>
  );
};

export default App;
