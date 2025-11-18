import { useEffect, useMemo, useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { listCompetenciasByOrganizacion, BackendCompetencia } from '../../competencias/services/competenciasService';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
// Removed charts per request
import { TopPartidosDiferencia } from '../components/TopPartidosDiferencia';
import { TablaStandings } from '../components/TablaStandings';

const EstadisticasOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [competenciaId, setCompetenciaId] = useState<string>('');
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [fase, setFase] = useState<string>('');

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
      setFase('');
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

  // Fases disponibles derivadas de los partidos cargados
  const fasesDisponibles = useMemo(() => {
    const set = new Set<string>();
    partidos.forEach((p) => {
      if (p.etapa && typeof p.etapa === 'string' && p.etapa.trim()) set.add(p.etapa);
    });
    return Array.from(set);
  }, [partidos]);

  // Partidos filtrados por fase (si se selecciona)
  const partidosFiltrados = useMemo(() => {
    if (!fase) return partidos;
    return partidos.filter((p) => (p.etapa ?? '') === fase);
  }, [partidos, fase]);

  const resumen = useMemo(() => {
    const finalizados = partidosFiltrados.filter((p) => p.estado === 'finalizado');
    const pendientes = partidosFiltrados.filter((p) => p.estado === 'pendiente');
    const confirmados = partidosFiltrados.filter((p) => p.estado === 'confirmado');

    const wins = finalizados.filter(
      (p) => (p.resultado?.puntosEquipo ?? 0) > (p.resultado?.puntosRival ?? 0),
    ).length;
    const draws = finalizados.filter(
      (p) => (p.resultado?.puntosEquipo ?? 0) === (p.resultado?.puntosRival ?? 0),
    ).length;
    const losses = finalizados.filter(
      (p) => (p.resultado?.puntosEquipo ?? 0) < (p.resultado?.puntosRival ?? 0),
    ).length;

    const puntosFavor = finalizados.reduce(
      (acc, p) => acc + (p.resultado?.puntosEquipo ?? 0),
      0,
    );
    const puntosContra = finalizados.reduce(
      (acc, p) => acc + (p.resultado?.puntosRival ?? 0),
      0,
    );
    const diferencia = puntosFavor - puntosContra;

    const efectividad = finalizados.length
      ? Math.round((wins / finalizados.length) * 100)
      : 0;

    return {
      finalizados: finalizados.length,
      pendientes: pendientes.length,
      confirmados: confirmados.length,
      puntosFavor,
      puntosContra,
      diferencia,
      efectividad,
      w: wins,
      d: draws,
      l: losses,
    };
  }, [partidosFiltrados]);

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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fase/Etapa</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={fase}
              onChange={(e) => setFase(e.target.value)}
            >
              <option value="">Todas</option>
              {fasesDisponibles.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TopPartidosDiferencia partidos={partidosFiltrados} />
        <TablaStandings partidos={partidosFiltrados} />
      </section>
    </div>
  );
};

export default EstadisticasOrgPage;
