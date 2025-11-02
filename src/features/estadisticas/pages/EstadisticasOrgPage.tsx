import { useEffect, useMemo, useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { listCompetenciasByOrganizacion, BackendCompetencia } from '../../competencias/services/competenciasService';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';

const EstadisticasOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [competenciaId, setCompetenciaId] = useState<string>('');
  const [partidos, setPartidos] = useState<Partido[]>([]);

  useEffect(() => {
    const orgId = organizacionSeleccionada?.id;
    if (!orgId) {
      setCompetencias([]);
      setCompetenciaId('');
      setPartidos([]);
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
      setPartidos([]);
      return;
    }
    let cancel = false;
    const run = async () => {
      const data = await getPartidosPorCompetencia(competenciaId);
      if (cancel) return;
      setPartidos(data);
    };
    run();
    return () => { cancel = true; };
  }, [competenciaId]);

  const resumen = useMemo(() => {
    const finalizados = partidos.filter(p => p.estado === 'finalizado');
    const pendientes = partidos.filter(p => p.estado === 'pendiente');
    const confirmados = partidos.filter(p => p.estado === 'confirmado');

    const puntosTotales = finalizados.reduce((acc, p) => acc + (p.resultado?.puntosEquipo ?? 0), 0);
    const puntosRivalTotales = finalizados.reduce((acc, p) => acc + (p.resultado?.puntosRival ?? 0), 0);
    const efectividad = finalizados.length
      ? Math.round((finalizados.filter(p => (p.resultado?.puntosEquipo ?? 0) > (p.resultado?.puntosRival ?? 0)).length / finalizados.length) * 100)
      : 0;

    return { finalizados: finalizados.length, pendientes: pendientes.length, confirmados: confirmados.length, puntosTotales, puntosRivalTotales, efectividad };
  }, [partidos]);

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una organización para ver sus estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500">Resumen por competencia</p>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-400">Partidos finalizados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{resumen.finalizados}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-400">Efectividad</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{resumen.efectividad}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-400">Puntos a favor</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{resumen.puntosTotales}</p>
        </div>
      </section>
    </div>
  );
};

export default EstadisticasOrgPage;
