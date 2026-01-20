import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { listCompetenciasByOrganizacion, BackendCompetencia } from '../../competencias/services/competenciasService';

const DashboardOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const orgId = organizacionSeleccionada?.id;
    if (!orgId) {
      setCompetencias([]);
      return;
    }
    let cancelado = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await listCompetenciasByOrganizacion(orgId);
        if (cancelado) return;
        setCompetencias(data);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelado = true;
    };
  }, [organizacionSeleccionada?.id]);

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una organización para ver su panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        {organizacionSeleccionada.logoUrl && (
          <img
            src={organizacionSeleccionada.logoUrl}
            alt={organizacionSeleccionada.nombre}
            className="h-16 w-16 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-sm"
          />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">{organizacionSeleccionada.nombre}</h1>
          <p className="text-sm text-slate-500">Resumen y accesos directos</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <a href="/competencias" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:bg-brand-50">
          <span className="text-2xl">🏆</span>
          <span className="font-semibold text-slate-900">Competencias</span>
        </a>
        <a href="/partidos" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:bg-brand-50">
          <span className="text-2xl">📅</span>
          <span className="font-semibold text-slate-900">Partidos</span>
        </a>
        <a href="/estadisticas" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:bg-brand-50">
          <span className="text-2xl">📊</span>
          <span className="font-semibold text-slate-900">Estadísticas</span>
        </a>
        <a href="/notificaciones" className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:bg-brand-50">
          <span className="text-2xl">🔔</span>
          <span className="font-semibold text-slate-900">Notificaciones</span>
        </a>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {competencias.map((c) => (
            <Link 
              key={c._id} 
              to={`/competencias/${c._id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {c.nombre ?? 'Competencia'}
                </h2>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                <p><span className="text-slate-400">Modalidad:</span> {c.modalidad ?? '—'}</p>
                <p><span className="text-slate-400">Categoría:</span> {c.categoria ?? '—'}</p>
                <p><span className="text-slate-400">Estado:</span> <span className="capitalize">{c.estado?.replace('_', ' ') ?? '—'}</span></p>
              </div>
            </Link>
          ))}
          {competencias.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">Sin competencias</p>
          ) : null}
        </section>
      )}
    </div>
  );
};

export default DashboardOrgPage;
