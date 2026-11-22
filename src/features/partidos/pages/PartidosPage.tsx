import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import {
  getPartidosPorFase,
  getPartidosPorCompetencia,
  getPartidosPorTemporada,
} from '../services/partidoService';
import type { JugadorPartido, Partido } from '../../../types';
import { ModalPartidoAdmin } from '../components';
import CalendarioPartidos from '../components/CalendarioPartidos';
import { useToken } from '../../../app/providers/AuthContext';
// Eliminado: ModalCrearPartido (no se crean partidos desde esta página)
import ModalAlineacionPartido from '../components/modals/ModalAlineacionPartido';
import ModalInformacionPartido from '../components/modals/ModalInformacionPartido';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { listCompetenciasByOrganizacion } from '../../competencias/services/competenciasService';
import { listTemporadasByCompetencia } from '../../competencias/services/temporadasService';
import { listFasesByTemporada } from '../../competencias/services/fasesService';
import { useFiltrosURL } from '../../../shared/hooks/useFiltrosURL';

type ModalAbierto = { tipo: 'admin' | 'alineacion' | 'info'; partidoId: string } | null;

const PartidosPage = () => {
  const token = useToken();
  const { organizacionSeleccionada } = useOrganizacion();
  const { addToast } = useToast();
  const [todos, setTodos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);
  // Un solo modal abierto a la vez: antes eran 3 pares "abierto + id" que podían desincronizarse.
  const [modal, setModal] = useState<ModalAbierto>(null);
  const cerrarModal = () => setModal(null);
  const pageSize = 16;
  // Opciones de los selects (datos, no filtros: se recargan según lo elegido)
  const [competencias, setCompetencias] = useState<Array<{ _id: string; nombre?: string }>>([]);
  const [temporadas, setTemporadas] = useState<Array<{ _id: string; nombre?: string }>>([]);
  const [fases, setFases] = useState<Array<{ _id: string; nombre?: string }>>([]);
  // Filtros en la URL: sobreviven a recargar, a "atrás" y se pueden compartir por link.
  const filtros = useFiltrosURL<'competencia' | 'temporada' | 'fase' | 'vista' | 'page'>();
  const competenciaId = filtros.get('competencia');
  const temporadaId = filtros.get('temporada');
  const faseId = filtros.get('fase');
  const vista: 'lista' | 'calendario' = filtros.get('vista') === 'calendario' ? 'calendario' : 'lista';
  const page = Math.max(1, Number(filtros.get('page')) || 1);
  const setPage = (n: number) => filtros.set({ page: n > 1 ? n : null });

  const refreshPartidos = useCallback(async () => {
    try {
      setLoading(true);
      let partidos: Partido[] = [];
      if (faseId) {
        partidos = await getPartidosPorFase(faseId);
      } else if (temporadaId) {
        partidos = await getPartidosPorTemporada(temporadaId);
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
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los partidos.' });
    } finally {
      setLoading(false);
    }
  }, [competenciaId, temporadaId, faseId, organizacionSeleccionada?.id, addToast]);

  useEffect(() => {
    if (!organizacionSeleccionada?.id) {
      setTodos([]);
      return;
    }
    void refreshPartidos();
  }, [organizacionSeleccionada?.id, refreshPartidos]);

  // Cambiar de organización invalida los filtros. Se compara contra la anterior (y no en cada
  // montaje) para no borrar los filtros que vienen en el link cuando el contexto termina de cargar.
  const orgAnterior = useRef(organizacionSeleccionada?.id);
  const { set: setFiltros } = filtros;
  useEffect(() => {
    const actual = organizacionSeleccionada?.id;
    if (orgAnterior.current && actual && orgAnterior.current !== actual) {
      setFiltros({ competencia: null, temporada: null, fase: null, page: null });
    }
    orgAnterior.current = actual;
  }, [organizacionSeleccionada?.id, setFiltros]);

  // Opciones de los selects. Sólo cargan datos: los resets de filtros hijos van en los onChange.
  useEffect(() => {
    setCompetencias([]);
    if (!organizacionSeleccionada?.id) return;
    listCompetenciasByOrganizacion(organizacionSeleccionada.id)
      .then((comps) => setCompetencias(comps as any))
      .catch(() => {});
  }, [organizacionSeleccionada?.id]);

  useEffect(() => {
    setTemporadas([]);
    if (!competenciaId) return;
    listTemporadasByCompetencia(competenciaId)
      .then((temps) => setTemporadas(temps as any))
      .catch(() => {});
  }, [competenciaId]);

  useEffect(() => {
    setFases([]);
    if (!temporadaId) return;
    listFasesByTemporada(temporadaId)
      .then((fs) => setFases(fs as any))
      .catch(() => {});
  }, [temporadaId]);

  const handleSeleccionar = (partidoId: string) => setModal({ tipo: 'admin', partidoId });
  const handleAbrirAlineacion = (partidoId: string) => setModal({ tipo: 'alineacion', partidoId });
  const handleAbrirInformacion = (partidoId: string) => setModal({ tipo: 'info', partidoId });

  const handleAlineacionActualizada = (jugadores: JugadorPartido[]) => {
    // setAlineacion(jugadores); // No longer needed as we don't store local alignment state
  };

  // Un link viejo puede traer ?page=9 de una lista que ahora es más corta.
  const totalPaginas = Math.max(1, Math.ceil(todos.length / pageSize));
  const paginaActual = Math.min(page, totalPaginas);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Partidos</h1>
          <p className="text-sm text-slate-500">
            Gestioná los encuentros de las competencias de {organizacionSeleccionada?.nombre}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => filtros.set({ vista: null })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${vista === 'lista' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => filtros.set({ vista: 'calendario' })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${vista === 'calendario' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Calendario
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div>
            <label htmlFor="partidospage-competencia" className="mb-1 block text-xs font-medium text-slate-600">Competencia</label>
            <select id="partidospage-competencia" 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" 
              value={competenciaId} 
              onChange={(e)=> filtros.set({ competencia: e.target.value, temporada: null, fase: null, page: null })}
            >
              <option value="">Todas las competencias</option>
              {competencias.map(c => (<option key={c._id} value={c._id}>{c.nombre || c._id}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="partidospage-temporada" className="mb-1 block text-xs font-medium text-slate-600">Temporada</label>
            <select id="partidospage-temporada" 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" 
              value={temporadaId} 
              onChange={(e)=> filtros.set({ temporada: e.target.value, fase: null, page: null })} 
              disabled={!competenciaId}
            >
              <option value="">Todas las temporadas</option>
              {temporadas.map(t => (<option key={t._id} value={t._id}>{t.nombre || t._id}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="partidospage-fase-etapa" className="mb-1 block text-xs font-medium text-slate-600">Fase / Etapa</label>
            <select id="partidospage-fase-etapa" 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" 
              value={faseId} 
              onChange={(e)=> filtros.set({ fase: e.target.value, page: null })} 
              disabled={!temporadaId}
            >
              <option value="">Todas las fases</option>
              {fases.map(f => (<option key={f._id} value={f._id}>{f.nombre || f._id}</option>))}
            </select>
          </div>
          <div className="flex">
            <button 
              type="button" 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm"
              onClick={()=> filtros.set({ competencia: null, temporada: null, fase: null, page: null })}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {modal?.tipo === 'admin' ? (
        <ModalPartidoAdmin
          partidoId={modal.partidoId}
          token={token ?? ''}
          onClose={cerrarModal}
          onPartidoEliminado={() => {
            cerrarModal();
            void refreshPartidos();
          }}
          onAlineacionActualizada={handleAlineacionActualizada}
        />
      ) : null}

      <ModalAlineacionPartido
        partidoId={modal?.tipo === 'alineacion' ? modal.partidoId : ''}
        isOpen={modal?.tipo === 'alineacion'}
        onClose={cerrarModal}
        onSaved={(jugadores) => {
          handleAlineacionActualizada(jugadores);
          cerrarModal();
        }}
      />

      <ModalInformacionPartido
        partidoId={modal?.tipo === 'info' ? modal.partidoId : null}
        isOpen={modal?.tipo === 'info'}
        onClose={cerrarModal}
      />

      {vista === 'calendario' ? (
        loading ? (
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          <CalendarioPartidos partidos={todos} onSeleccionar={handleSeleccionar} />
        )
      ) : (
        /* Lista única con paginación */
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Todos los partidos filtrados</h2>
            <span className="text-xs uppercase tracking-wide text-muted">{todos.length} en total</span>
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
                {todos.slice((paginaActual - 1) * pageSize, paginaActual * pageSize).map((partido) => (
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
                          {partido.resultado ? 'Ver resultado' : 'Cargar resultado'}
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setPage(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>
                <span className="text-xs text-slate-600">Página {paginaActual} de {totalPaginas}</span>
                <button
                  type="button"
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setPage(paginaActual + 1)}
                  disabled={paginaActual >= totalPaginas}
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
      )}
    </div>
  );
};

export default PartidosPage;
