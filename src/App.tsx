import { Routes, Route, Navigate } from 'react-router-dom';
import PerfilPage from './features/perfil/pages/PerfilPage';
import LoginPage from './features/auth/pages/LoginPage';
import ProtectedRoute from './app/routes/ProtectedRoute';
import OrganizacionPage from './features/organizacion/pages/OrganizacionPage';
import Navbar from './app/layout/Navbar';
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardOrgPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizacion"
            element={
              <ProtectedRoute>
                <OrganizacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competencias"
            element={
              <ProtectedRoute>
                <CompetenciasOrgPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competencias/:id"
            element={
              <ProtectedRoute>
                <CompetenciaDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partidos"
            element={
              <ProtectedRoute>
                <PartidosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute>
                <EstadisticasOrgPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <NotificacionesOrgPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Overtime Dodgeball</span>
          <span>Gestión diaria para Organizadores y Staff</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
