import { useState, useMemo, useEffect } from 'react';
import type { BackendTemporada, BackendFase, BackendParticipacionTemporada, BackendParticipacionFase } from '../services';
import CrearTemporadaModal from '../modals/CrearTemporadaModal';
import CrearFaseModal from '../modals/CrearFaseModal';
import JugadoresTemporadaModal from '../modals/JugadoresTemporadaModal';
import GestionEquiposTemporadaModal from '../modals/GestionEquiposTemporadaModal';
import GestionParticipantesFaseModal from '../modals/GestionFaseModal';
import ConfigurarReglamentoModal from '../modals/ConfigurarReglamentoModal';
import { TablaPosiciones } from '../../../shared/components/TablaPosiciones';

type Props = {
  esAdmin: boolean;
  loading: boolean;
  onRefresh?: () => void | Promise<void>;
  onSubmitCrearTemporada: (payload: { nombre: string; fechaInicio: string; fechaFin?: string }) => void | Promise<void>;
  temporadas: BackendTemporada[];
  fasesPorTemporada: Record<string, BackendFase[]>;
  onSubmitCrearFase: (
    temporadaId: string,
    payload: {
      nombre: string;
      descripcion?: string;
      tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
      orden?: number;
      fechaInicio?: string;
      fechaFin?: string;
      numeroClasificados?: number;
      faseOrigenA?: string;
      faseOrigenB?: string;
      configuracion?: any;
    }
  ) => void | Promise<void>;
  onEditarTemporada: (t: BackendTemporada) => void;
  onEliminarTemporada: (t: BackendTemporada) => void;
  onGenerarFixture: (faseId: string) => void;
  onEditarFase: (fase: BackendFase, temporadaId: string, payload?: Partial<BackendFase>) => void;
  onEliminarFase: (fase: BackendFase, temporadaId: string) => void;
  participacionesTemporadaPorId: Record<string, BackendParticipacionTemporada[]>;
  participacionesFasePorId: Record<string, BackendParticipacionFase[]>;
  onCrearSolicitudParticipacionTemporada: (temporadaId: string, equipoId: string) => void | Promise<void>;
  onCrearParticipacionFase: (faseId: string, participacionTemporadaId: string, opts?: { grupo?: string; division?: string }) => void | Promise<void>;
  onUpdateParticipacionTemporada: (id: string, body: Partial<{ estado: string }>) => void | Promise<void>;
  onDeleteParticipacionTemporada: (id: string, temporadaId: string) => void | Promise<void>;
};

export default function EstructuraSection(props: Props) {
  const {
    esAdmin,
    loading,
    onRefresh,
    onSubmitCrearTemporada,
    temporadas,
    fasesPorTemporada,
    onSubmitCrearFase,
    onEditarTemporada,
    onEliminarTemporada,
    onGenerarFixture,
    onEditarFase,
    onEliminarFase,
    participacionesTemporadaPorId,
    participacionesFasePorId,
    onCrearSolicitudParticipacionTemporada,
    onCrearParticipacionFase,
    onUpdateParticipacionTemporada,
    onDeleteParticipacionTemporada,
  } = props;

  const [selectedTemporadaId, setSelectedTemporadaId] = useState<string | null>(null);

  // Ordenamos temporadas por fecha (más reciente primero)
  const sortedTemporadas = useMemo(() => {
    return [...temporadas].sort((a, b) => {
      const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
      const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
      return dateB - dateA;
    });
  }, [temporadas]);

  // Si no hay seleccionada o la que estaba ya no existe, elegimos la más reciente
  useEffect(() => {
    if (sortedTemporadas.length > 0) {
      if (!selectedTemporadaId || !sortedTemporadas.some(st => st._id === selectedTemporadaId)) {
        setSelectedTemporadaId(sortedTemporadas[0]._id);
      }
    } else {
      setSelectedTemporadaId(null);
    }
  }, [sortedTemporadas, selectedTemporadaId]);

  const t = useMemo(() => {
    return sortedTemporadas.find(temp => temp._id === selectedTemporadaId) || sortedTemporadas[0];
  }, [sortedTemporadas, selectedTemporadaId]);

  // --- NUEVOS ESTADOS PARA UX/UI ---
  const [expandedFases, setExpandedFases] = useState<Record<string, boolean>>({});

  const toggleFase = (faseId: string) => {
    setExpandedFases(prev => ({ ...prev, [faseId]: !prev[faseId] }));
  };

  const getTipoBadgeClass = (tipo?: string) => {
    switch (tipo) {
      case 'grupo': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'liga': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'playoff': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // ---------------------------------

  const [openCrearTemporada, setOpenCrearTemporada] = useState(false);
  const [openCrearFase, setOpenCrearFase] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openJugadores, setOpenJugadores] = useState<{ open: boolean; pt?: BackendParticipacionTemporada }>( { open: false });
  const [openGestionEquipos, setOpenGestionEquipos] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openGestionParticipantesFase, setOpenGestionParticipantesFase] = useState<{ open: boolean; fase?: BackendFase; temporadaId?: string }>({ open: false });
  const [openReglamento, setOpenReglamento] = useState<{ open: boolean; fase: BackendFase | null; temporadaId?: string }>({ open: false, fase: null });

  

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Temporadas y fases</h2>
          {temporadas.length > 0 && (
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={selectedTemporadaId || ''}
              onChange={(e) => setSelectedTemporadaId(e.target.value)}
            >
              {sortedTemporadas.map((temp) => (
                <option key={temp._id} value={temp._id}>
                  {temp.nombre} {temp.fechaInicio ? `(${new Date(temp.fechaInicio).getFullYear()})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <button type="button" disabled={!esAdmin} onClick={() => setOpenCrearTemporada(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50">Crear temporada</button>
      </div>

      <section className="space-y-4 mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : !t ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              📅
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">No hay temporadas</h3>
            <p className="mt-1 text-sm text-slate-500">Comenzá creando una temporada para organizar las fases y equipos.</p>
            <div className="mt-6">
              <button
                type="button"
                disabled={!esAdmin}
                onClick={() => setOpenCrearTemporada(true)}
                className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                + Crear temporada
              </button>
            </div>
          </div>
        ) : (
          <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card">
            {/* Timeline / Progress Indicator */}
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Guía de configuración</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { label: 'Temporada', done: true },
                  { label: 'Cargar Equipos', done: (participacionesTemporadaPorId[t._id] || []).length > 0 },
                  { label: 'Crear Fases', done: (fasesPorTemporada[t._id] || []).length > 0 },
                  { label: 'Generar Fixtures', done: false }, // Simplificado
                ].map((step, idx, arr) => (
                  <div key={step.label} className="flex items-center shrink-0">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <span className={`ml-2 text-xs font-medium ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                    {idx < arr.length - 1 && <div className="mx-4 h-px w-8 bg-slate-200" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.nombre}</h3>
                <div className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                     {(participacionesTemporadaPorId[t._id] || []).length} equipos inscritos
                  </span>
                  <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50" onClick={()=> setOpenGestionEquipos({ open: true, temporadaId: t._id })} disabled={!esAdmin}>
                    Gestionar altas →
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={!esAdmin} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onEditarTemporada(t)}>Editar</button>
                <button disabled={!esAdmin} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50" onClick={() => onEliminarTemporada(t)}>Eliminar</button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 mt-8 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Fases de la competencia</h4>
              <button 
                disabled={!esAdmin} 
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors" 
                onClick={() => setOpenCrearFase({ open: true, temporadaId: t._id })}
              >
                + Nueva fase
              </button>
            </div>

            <div className="space-y-3">
              {(fasesPorTemporada[t._id] || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <span className="text-sm text-slate-400">Aún no hay fases definidas para esta temporada.</span>
                </div>
              ) : (
                fasesPorTemporada[t._id].map((f) => (
                  <div key={f._id} className="overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-slate-300">
                    <div 
                      className="flex cursor-pointer items-center justify-between bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                      onClick={() => toggleFase(f._id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{expandedFases[f._id] ? '▾' : '▸'}</span>
                        <span className="font-bold text-slate-900">{f.nombre ?? 'Fase'}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getTipoBadgeClass(f.tipo)}`}>
                          {f.tipo || 'otro'}
                        </span>
                        {f.estado && (
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Fase en curso" />
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          disabled={!esAdmin} 
                          className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 transition-colors" 
                          onClick={() => setOpenReglamento({ open: true, fase: f, temporadaId: t._id })}
                          title="Configurar Reglamento"
                        >
                          🔨
                        </button>
                        <button 
                          disabled={!esAdmin} 
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" 
                          onClick={() => onEditarFase(f, t._id)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          disabled={!esAdmin} 
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" 
                          onClick={() => onEliminarFase(f, t._id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {expandedFases[f._id] && (
                      <div className="border-t border-slate-200 bg-white p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            {(participacionesFasePorId[f._id] || []).length} equipos en esta fase
                          </span>
                          <button 
                            disabled={!esAdmin} 
                            className="text-xs font-bold text-brand-600 hover:underline disabled:opacity-50" 
                            onClick={() => setOpenGestionParticipantesFase({ open: true, fase: f, temporadaId: t._id })}
                          >
                            Gestionar participantes →
                          </button>
                        </div>
                        {/* Tabla de posiciones */}
                        <TablaPosiciones participaciones={(participacionesFasePorId[f._id] || []).map(p => ({
                          id: p._id,
                          participacionTemporada: p.participacionTemporada as any, // Asumir populate
                          grupo: p.grupo,
                          division: p.division,
                          puntos: (p as any).puntos || 0,
                          partidosJugados: (p as any).partidosJugados || 0,
                          partidosGanados: (p as any).partidosGanados || 0,
                          partidosPerdidos: (p as any).partidosPerdidos || 0,
                          partidosEmpatados: (p as any).partidosEmpatados || 0,
                          diferenciaPuntos: (p as any).diferenciaPuntos || 0,
                          posicion: (p as any).posicion,
                        }))} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <CrearTemporadaModal
        isOpen={openCrearTemporada}
        onClose={() => setOpenCrearTemporada(false)}
        onSubmit={async (payload: { nombre: string; fechaInicio: string; fechaFin?: string }) => { await onSubmitCrearTemporada(payload); }}
      />

      <CrearFaseModal
        isOpen={openCrearFase.open}
        onClose={() => setOpenCrearFase({ open: false })}
        onSubmit={async (payload: { nombre: string; descripcion?: string }) => { if (openCrearFase.temporadaId) { await onSubmitCrearFase(openCrearFase.temporadaId, payload); setOpenCrearFase({ open: false }); } }}
      />

      <JugadoresTemporadaModal
        isOpen={openJugadores.open}
        onClose={() => setOpenJugadores({ open: false })}
        participacion={openJugadores.pt}
      />

      <GestionEquiposTemporadaModal
        isOpen={openGestionEquipos.open}
        onClose={() => setOpenGestionEquipos({ open: false })}
        esAdmin={esAdmin}
        onRefresh={onRefresh}
        temporadaId={openGestionEquipos.temporadaId || ''}
        participaciones={openGestionEquipos.temporadaId ? (participacionesTemporadaPorId[openGestionEquipos.temporadaId] || []) : []}
        onUpdateParticipacionTemporada={onUpdateParticipacionTemporada}
        onDeleteParticipacionTemporada={onDeleteParticipacionTemporada}
        onCrearSolicitudParticipacionTemporada={onCrearSolicitudParticipacionTemporada}
        onOpenJugadores={(pt) => setOpenJugadores({ open: true, pt })}
      />

      <GestionParticipantesFaseModal
        isOpen={openGestionParticipantesFase.open}
        onClose={() => setOpenGestionParticipantesFase({ open: false })}
        esAdmin={esAdmin}
        onRefresh={onRefresh}
        fase={openGestionParticipantesFase.fase}
        temporadaId={openGestionParticipantesFase.temporadaId}
        participantesFase={openGestionParticipantesFase.fase ? (participacionesFasePorId[openGestionParticipantesFase.fase._id] || []) : []}
        participantesTemporada={openGestionParticipantesFase.temporadaId ? (participacionesTemporadaPorId[openGestionParticipantesFase.temporadaId] || []) : []}
        onAgregar={onCrearParticipacionFase}
        onGenerarLlave={(faseId) => onGenerarFixture(faseId)}
      />

      <ConfigurarReglamentoModal
        isOpen={openReglamento.open}
        fase={openReglamento.fase}
        todasLasFases={openReglamento.temporadaId ? (fasesPorTemporada[openReglamento.temporadaId] || []) : []}
        onClose={() => setOpenReglamento({ open: false, fase: null })}
        onSave={async (_, config) => {
          if (openReglamento.temporadaId && openReglamento.fase) {
            await onEditarFase(openReglamento.fase, openReglamento.temporadaId, { configuracion: config });
          }
        }}
      />
    </>
  );
}
