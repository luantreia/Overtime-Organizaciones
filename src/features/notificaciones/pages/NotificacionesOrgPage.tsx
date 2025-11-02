import { useEffect, useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { listCompetenciasByOrganizacion, BackendCompetencia } from '../../competencias/services/competenciasService';
import { getSolicitudesPorCompetencia, SolicitudEquipoCompetencia } from '../../competencias/services/equipoCompetenciaOrgService';
const NotificacionesOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [competenciaId, setCompetenciaId] = useState('');
  const [pendientes, setPendientes] = useState<SolicitudEquipoCompetencia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const orgId = organizacionSeleccionada?.id;
    if (!orgId) {
      setCompetencias([]);
      setCompetenciaId('');
      setPendientes([]);
      return;
    }
    let cancel = false;
    const run = async () => {
      const data = await listCompetenciasByOrganizacion(orgId);
      if (cancel) return;
      setCompetencias(data);
      if (data.length && !competenciaId) setCompetenciaId(data[0]._id);
    };
    run();
    return () => { cancel = true; };
  }, [organizacionSeleccionada?.id]);

  useEffect(() => {
    if (!competenciaId) {
      setPendientes([]);
      return;
    }
    let cancel = false;
    const run = async () => {
      try {
        setLoading(true);
        const data = await getSolicitudesPorCompetencia(competenciaId, 'pendiente');
        if (cancel) return;
        setPendientes(data);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => { cancel = true; };
  }, [competenciaId]);

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una organización para ver las notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>
        <p className="text-sm text-slate-500">Solicitudes de equipos a competencias de tu organización.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Competencia</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={competenciaId}
              onChange={(e) => setCompetenciaId(e.target.value)}
            >
              {competencias.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre ?? 'Competencia'}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Solicitudes pendientes</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : pendientes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-3">
            {pendientes.map((s) => {
              const equipoNombre = typeof s.equipo === 'string' ? s.equipo : (s.equipo?.nombre ?? 'Equipo');
              return (
                <li key={s._id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{equipoNombre}</p>
                    <span className="text-xs font-medium uppercase tracking-wide text-amber-700">Pendiente</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default NotificacionesOrgPage;
