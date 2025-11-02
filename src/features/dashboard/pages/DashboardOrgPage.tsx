import { useEffect, useState } from 'react';
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
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{organizacionSeleccionada.nombre}</h1>
        <p className="text-sm text-slate-500">Resumen de competencias</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {competencias.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">{c.nombre ?? 'Competencia'}</h2>
              <div className="mt-2 text-sm text-slate-600">
                <p>Modalidad: {c.modalidad ?? '—'}</p>
                <p>Categoría: {c.categoria ?? '—'}</p>
                <p>Estado: {c.estado ?? '—'}</p>
              </div>
            </div>
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
