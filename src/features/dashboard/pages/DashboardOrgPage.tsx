import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { listCompetenciasByOrganizacion, getCompetenciaDetalle, type BackendCompetencia } from '../../competencias/services/competenciasService';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import { getSolicitudesEdicion } from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import type { Partido } from '../../../types';
import AtencionSection, { type HuecoDato } from '../sections/AtencionSection';
import ProximosPartidosSection from '../sections/ProximosPartidosSection';
import ProgresoTemporadasSection, { type ProgresoTemporada } from '../sections/ProgresoTemporadasSection';

const DashboardOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [loadingCompetencias, setLoadingCompetencias] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([]);
  const [partidosProximos, setPartidosProximos] = useState<Partido[]>([]);
  const [huecos, setHuecos] = useState<HuecoDato[]>([]);
  const [progresoTemporadas, setProgresoTemporadas] = useState<ProgresoTemporada[]>([]);
  const [solicitudesPendientesCount, setSolicitudesPendientesCount] = useState(0);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);

  // Competencias de la organización
  useEffect(() => {
    const orgId = organizacionSeleccionada?.id;
    if (!orgId) {
      setCompetencias([]);
      return;
    }
    let cancelado = false;
    const fetchData = async () => {
      try {
        setLoadingCompetencias(true);
        const data = await listCompetenciasByOrganizacion(orgId);
        if (!cancelado) setCompetencias(data);
      } finally {
        if (!cancelado) setLoadingCompetencias(false);
      }
    };
    fetchData();
    return () => {
      cancelado = true;
    };
  }, [organizacionSeleccionada?.id]);

  // Solicitudes pendientes de aprobar (independiente de las competencias, ver plan: no se filtra por org)
  useEffect(() => {
    if (!organizacionSeleccionada?.id) {
      setSolicitudesPendientesCount(0);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        setLoadingSolicitudes(true);
        const resp = await getSolicitudesEdicion({ scope: 'aprobables', estado: 'pendiente' });
        if (!cancelado) setSolicitudesPendientesCount(resp.total ?? resp.solicitudes.length);
      } catch {
        if (!cancelado) setSolicitudesPendientesCount(0);
      } finally {
        if (!cancelado) setLoadingSolicitudes(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [organizacionSeleccionada?.id]);

  // Partidos pendientes/próximos + progreso de temporadas + huecos de datos, por competencia
  useEffect(() => {
    if (competencias.length === 0) {
      setPartidosPendientes([]);
      setPartidosProximos([]);
      setHuecos([]);
      setProgresoTemporadas([]);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        setLoadingResumen(true);
        const ahora = new Date();
        const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

        const resultados = await Promise.all(
          competencias.map(async (c) => {
            const [detalle, partidos] = await Promise.all([
              getCompetenciaDetalle(c._id),
              getPartidosPorCompetencia(c._id),
            ]);
            return { competencia: c, detalle, partidos };
          })
        );

        if (cancelado) return;

        const pendientes: Partido[] = [];
        const proximos: Partido[] = [];
        const huecosAcumulados: HuecoDato[] = [];
        const progresoAcumulado: ProgresoTemporada[] = [];

        for (const { competencia, detalle, partidos } of resultados) {
          for (const p of partidos) {
            if (p.estado !== 'programado' && p.estado !== 'en_juego') continue;
            const fechaPartido = new Date(p.hora ? `${p.fecha}T${p.hora}` : p.fecha);
            if (Number.isNaN(fechaPartido.getTime())) continue;
            if (fechaPartido < ahora) pendientes.push(p);
            else if (fechaPartido <= en7dias) proximos.push(p);
          }

          const temporadas = detalle.temporadas ?? [];
          const nombreCompetencia = competencia.nombre ?? 'Competencia';

          if (temporadas.length === 0) {
            huecosAcumulados.push({
              id: `comp-sin-temporada-${competencia._id}`,
              texto: `"${nombreCompetencia}" no tiene ninguna temporada creada`,
              href: `/competencias/${competencia._id}`,
            });
          }

          for (const t of temporadas) {
            if (!t.fechaFin) {
              huecosAcumulados.push({
                id: `temp-sin-fin-${t._id}`,
                texto: `Temporada "${t.nombre}" (${nombreCompetencia}) no tiene fecha de fin`,
                href: `/competencias/${competencia._id}`,
              });
            }

            const inicio = t.fechaInicio ? new Date(t.fechaInicio) : null;
            const fin = t.fechaFin ? new Date(t.fechaFin) : null;
            const vigentePorFecha = !!(inicio && fin && ahora >= inicio && ahora <= fin);
            const noHaCerrado = !fin || fin >= ahora;

            if (vigentePorFecha && t.estado !== 'en_curso') {
              huecosAcumulados.push({
                id: `temp-desactualizada-${t._id}`,
                texto: `Temporada "${t.nombre}" (${nombreCompetencia}) está dentro de sus fechas pero figura como "${t.estado ?? 'sin estado'}"`,
                href: `/competencias/${competencia._id}`,
              });
            }

            if (noHaCerrado) {
              for (const f of t.fases ?? []) {
                if ((f.participaciones ?? []).length === 0) {
                  huecosAcumulados.push({
                    id: `fase-sin-equipos-${f._id}`,
                    texto: `Fase "${f.nombre ?? 'sin nombre'}" de "${t.nombre}" (${nombreCompetencia}) no tiene equipos inscriptos`,
                    href: `/competencias/${competencia._id}`,
                  });
                }
              }
            }

            if (vigentePorFecha || t.estado === 'en_curso') {
              const faseIds = new Set((t.fases ?? []).map((f) => f._id));
              const partidosDeTemporada = partidos.filter((p) => p.faseId && faseIds.has(p.faseId));
              const jugados = partidosDeTemporada.filter((p) => p.estado === 'finalizado').length;
              progresoAcumulado.push({
                id: t._id,
                competenciaId: competencia._id,
                competenciaNombre: nombreCompetencia,
                temporadaNombre: t.nombre,
                equipos: (t.participaciones ?? []).length,
                partidosJugados: jugados,
                partidosTotal: partidosDeTemporada.length,
              });
            }
          }
        }

        pendientes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        proximos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        setPartidosPendientes(pendientes);
        setPartidosProximos(proximos);
        setHuecos(huecosAcumulados);
        setProgresoTemporadas(progresoAcumulado);
      } finally {
        if (!cancelado) setLoadingResumen(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [competencias]);

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una organización para ver su panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
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

      <AtencionSection
        loading={loadingResumen || loadingSolicitudes}
        partidosPendientes={partidosPendientes}
        solicitudesPendientesCount={solicitudesPendientesCount}
        huecos={huecos}
      />

      <ProximosPartidosSection loading={loadingResumen} partidos={partidosProximos} />

      <ProgresoTemporadasSection loading={loadingResumen} temporadas={progresoTemporadas} />

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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Todas mis competencias</h2>
        {loadingCompetencias ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {competencias.map((c) => (
              <Link
                key={c._id}
                to={`/competencias/${c._id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {c.nombre ?? 'Competencia'}
                  </h3>
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
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardOrgPage;
