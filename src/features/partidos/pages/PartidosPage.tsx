import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import {
  actualizarPartido,
  getAlineacion,
  getPartido,
  getPartidos,
  getPartidosPorFase,
  getPartidosPorCompetencia,
} from '../services/partidoService';
import type { JugadorPartido, Partido } from '../../../types';
import { ModalPartidoAdmin } from '../components';
import { useToken } from '../../../app/providers/AuthContext';
// Eliminado: ModalCrearPartido (no se crean partidos desde esta página)
import ModalAlineacionPartido from '../components/modals/ModalAlineacionPartido';
import ModalInformacionPartido from '../components/modals/ModalInformacionPartido';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { listCompetenciasByOrganizacion } from '../../competencias/services/competenciasService';
import { listTemporadasByCompetencia } from '../../competencias/services/temporadasService';
import { listFasesByTemporada } from '../../competencias/services/fasesService';

const PartidosPage = () => {
  const token = useToken();
  const { organizacionSeleccionada } = useOrganizacion();
  const { addToast } = useToast();
  const [seleccionado, setSeleccionado] = useState<Partido | null>(null);
  const [todos, setTodos] = useState<Partido[]>([]);
  const [alineacion, setAlineacion] = useState<JugadorPartido[]>([]);
  const [loading, setLoading] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [partidoAdminId, setPartidoAdminId] = useState<string | null>(null);
  const [alineacionModalAbierto, setAlineacionModalAbierto] = useState(false);
  const [partidoAlineacionId, setPartidoAlineacionId] = useState<string | null>(null);
  const [infoModalAbierto, setInfoModalAbierto] = useState(false);
  const [partidoInfoId, setPartidoInfoId] = useState<string | null>(null);
  // Paginación
  const [page, setPage] = useState<number>(1);
  const pageSize = 16;
  // Filtros por competencia > temporada > fase
  const [competencias, setCompetencias] = useState<Array<{ _id: string; nombre?: string }>>([]);
  const [temporadas, setTemporadas] = useState<Array<{ _id: string; nombre?: string }>>([]);
  const [fases, setFases] = useState<Array<{ _id: string; nombre?: string }>>([]);
  const [competenciaId, setCompetenciaId] = useState<string>('');
  const [temporadaId, setTemporadaId] = useState<string>('');
  const [faseId, setFaseId] = useState<string>('');

  const refreshPartidos = useCallback(async () => {
    try {
      setLoading(true);
      let partidos: Partido[] = [];
      if (faseId) {
        partidos = await getPartidosPorFase(faseId);
      } else if (competenciaId) {
        partidos = await getPartidosPorCompetencia(competenciaId);
      } else if (organizacionSeleccionada?.id) {
        // sin filtros: traer todos los partidos de todas las competencias de la organización
        const comps = await listCompetenciasByOrganizacion(organizacionSeleccionada.id);
        const listas = await Promise.all(
          comps.map(c => getPartidosPorCompetencia(c._id).catch(() => [] as Partido[]))
        );
        partidos = listas.flat();
      } else {
        setTodos([]);
        return;
      }
      // Ordenar por fecha ascendente (más próximos primero)
      const ordenados = [...partidos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      setTodos(ordenados);
      setPage(1);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los partidos.' });
    } finally {
      setLoading(false);
    }
  }, [competenciaId, faseId, organizacionSeleccionada?.id]);

  useEffect(() => {
    if (!competenciaId && !faseId && !organizacionSeleccionada?.id) {
      setTodos([]);
      setSeleccionado(null);
      return;
    }
    void refreshPartidos();
  }, [competenciaId, faseId, organizacionSeleccionada?.id, refreshPartidos]);

  // Cargar listas para filtros
  useEffect(() => {
    const load = async () => {
      setCompetencias([]);
      setTemporadas([]); setFases([]); setTemporadaId(''); setFaseId(''); setCompetenciaId('');
      if (!organizacionSeleccionada?.id) return;
      try {
        const comps = await listCompetenciasByOrganizacion(organizacionSeleccionada.id);
        setCompetencias(comps as any);
      } catch {}
    };
    void load();
  }, [organizacionSeleccionada?.id]);

  useEffect(() => {
    const load = async () => {
      setTemporadas([]); setFases([]); setTemporadaId(''); setFaseId('');
      if (!competenciaId) return;
      try {
        const temps = await listTemporadasByCompetencia(competenciaId);
        setTemporadas(temps as any);
      } catch {}
    };
    void load();
  }, [competenciaId]);

  useEffect(() => {
    const load = async () => {
      setFases([]); setFaseId('');
      if (!temporadaId) return;
      try {
        const fs = await listFasesByTemporada(temporadaId);
        setFases(fs as any);
      } catch {}
    };
    void load();
  }, [temporadaId]);

  const handleSeleccionar = async (partidoId: string) => {
    try {
      setDetalleLoading(true);
      const [detalle, jugadores] = await Promise.all([
        getPartido(partidoId),
        getAlineacion(partidoId),
      ]);
      setSeleccionado(detalle);
      setAlineacion(jugadores);
      setPartidoAdminId(partidoId);
      setModalAdminAbierto(true);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar el detalle del partido' });
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleAbrirAlineacion = (partidoId: string) => {
    setPartidoAlineacionId(partidoId);
    setAlineacionModalAbierto(true);
  };

  const handleCerrarAlineacion = () => {
    setAlineacionModalAbierto(false);
    setPartidoAlineacionId(null);
  };

  const handleAbrirInformacion = (partidoId: string) => {
    setPartidoInfoId(partidoId);
    setInfoModalAbierto(true);
  };

  const handleCerrarInformacion = () => {
    setInfoModalAbierto(false);
    setPartidoInfoId(null);
  };

  const handleAlineacionActualizada = (jugadores: JugadorPartido[]) => {
    setAlineacion(jugadores);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Partidos</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Filtros:</span>
            <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={competenciaId} onChange={(e)=> setCompetenciaId(e.target.value)}>
              <option value="">Competencia…</option>
              {competencias.map(c => (<option key={c._id} value={c._id}>{c.nombre || c._id}</option>))}
            </select>
            <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={temporadaId} onChange={(e)=> setTemporadaId(e.target.value)} disabled={!competenciaId}>
              <option value="">Temporada…</option>
              {temporadas.map(t => (<option key={t._id} value={t._id}>{t.nombre || t._id}</option>))}
            </select>
            <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={faseId} onChange={(e)=> setFaseId(e.target.value)} disabled={!temporadaId}>
              <option value="">Fase…</option>
              {fases.map(f => (<option key={f._id} value={f._id}>{f.nombre || f._id}</option>))}
            </select>
            <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50" onClick={()=>{ setCompetenciaId(''); setTemporadaId(''); setFaseId(''); setPage(1); }}>Limpiar filtros</button>
          </div>
        </div>
      </header>

      {modalAdminAbierto && partidoAdminId ? (
        <ModalPartidoAdmin
          partidoId={partidoAdminId}
          token={token ?? ''}
          onClose={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
          }}
          onPartidoEliminado={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
            void refreshPartidos();
          }}
          onAlineacionActualizada={handleAlineacionActualizada}
        />
      ) : null}

      <ModalAlineacionPartido
        partidoId={partidoAlineacionId ?? ''}
        isOpen={alineacionModalAbierto && Boolean(partidoAlineacionId)}
        onClose={handleCerrarAlineacion}
        onSaved={(jugadores) => {
          handleAlineacionActualizada(jugadores);
          handleCerrarAlineacion();
        }}
      />

      <ModalInformacionPartido
        partidoId={partidoInfoId}
        isOpen={infoModalAbierto && Boolean(partidoInfoId)}
        onClose={handleCerrarInformacion}
      />

      {/* Lista única con paginación */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Todos los partidos filtrados</h2>
          <span className="text-xs uppercase tracking-wide text-slate-400">{todos.length} en total</span>
        </header>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : todos.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {todos.slice((page - 1) * pageSize, page * pageSize).map((partido) => (
                <PartidoCard
                  key={partido.id}
                  partido={partido}
                  variante={partido.resultado ? 'resultado' : 'proximo'}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => handleAbrirAlineacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🏐 Alineación
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbrirInformacion(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        🖊️ Datos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSeleccionar(partido.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      >
                        📊 Estadísticas
                      </button>
                    </>
                  }
                />
              ))}
            </div>
            {/* Paginación */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Página {page} de {Math.max(1, Math.ceil(todos.length / pageSize))}</span>
              </div>
              <button
                type="button"
                className="rounded border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage(p => Math.min(Math.ceil(todos.length / pageSize), p + 1))}
                disabled={page >= Math.ceil(todos.length / pageSize)}
              >
                Siguiente →
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            No hay partidos para los filtros seleccionados.
          </p>
        )}
      </section>
    </div>
  );
};

export default PartidosPage;
