import { useState, useMemo, useEffect } from 'react';
import type { BackendTemporada, BackendFase, BackendParticipacionTemporada, BackendParticipacionFase } from '../services';
import { finalizarFase } from '../services';
import CrearTemporadaModal from '../modals/CrearTemporadaModal';
import CrearFaseModal from '../modals/CrearFaseModal';
import JugadoresTemporadaModal from '../modals/JugadoresTemporadaModal';
import GestionEquiposTemporadaModal from '../modals/GestionEquiposTemporadaModal';
import GestionParticipantesFaseModal from '../modals/GestionFaseModal';
import ConfigurarReglamentoModal from '../modals/ConfigurarReglamentoModal';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import { TablaPosiciones } from '../../../shared/components/TablaPosiciones';
import { VisualBracket } from '../components/VisualBracket';
import { getPartidosPorFase } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPencil = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
  </svg>
);

const IconCog = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const IconChevronRight = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
    <path d="M1 6l3.5 3.5L11 2" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tipoBadgeClass(tipo?: string): string {
  switch (tipo) {
    case 'grupo':     return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'liga':      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'playoff':   return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'promocion': return 'bg-green-100 text-green-700 border-green-200';
    default:          return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function mapParticipacionesFase(participaciones: BackendParticipacionFase[]) {
  return participaciones.map(p => ({
    id: p._id,
    participacionTemporada: p.participacionTemporada as any,
    grupo: p.grupo,
    division: p.division,
    puntos: p.puntos || 0,
    partidosJugados: p.partidosJugados || 0,
    partidosGanados: p.partidosGanados || 0,
    partidosPerdidos: p.partidosPerdidos || 0,
    partidosEmpatados: p.partidosEmpatados || 0,
    diferenciaPuntos: p.diferenciaPuntos || 0,
    posicion: p.posicion,
  }));
}

// ─── PlayoffBracketOverview (fuera del render para evitar re-mounts) ──────────

function PlayoffBracketOverview({ faseId }: { faseId: string }) {
  const [matches, setMatches] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartidosPorFase(faseId)
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [faseId]);

  if (loading) return <div className="py-6 text-center text-xs text-slate-400">Cargando llaves…</div>;
  if (matches.length === 0) return (
    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
      No hay partidos generados todavía.
    </div>
  );
  return (
    <div className="overflow-x-auto py-2">
      <div className="min-w-[800px]">
        <VisualBracket matches={matches} />
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  onEditarTemporada: (t: BackendTemporada, nuevoNombre: string) => void | Promise<void>;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function EstructuraSection(props: Props) {
  const {
    esAdmin, loading, onRefresh,
    onSubmitCrearTemporada, temporadas, fasesPorTemporada, onSubmitCrearFase,
    onEditarTemporada, onEliminarTemporada, onGenerarFixture,
    onEditarFase, onEliminarFase,
    participacionesTemporadaPorId, participacionesFasePorId,
    onCrearSolicitudParticipacionTemporada, onCrearParticipacionFase,
    onUpdateParticipacionTemporada, onDeleteParticipacionTemporada,
  } = props;

  const { addToast } = useToast();

  // ── Temporada selection ───────────────────────────────────────────────────
  const [selectedTemporadaId, setSelectedTemporadaId] = useState<string | null>(null);

  const sortedTemporadas = useMemo(
    () => [...temporadas].sort((a, b) => {
      const dA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
      const dB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
      return dB - dA;
    }),
    [temporadas],
  );

  useEffect(() => {
    if (sortedTemporadas.length > 0) {
      if (!selectedTemporadaId || !sortedTemporadas.some(st => st._id === selectedTemporadaId)) {
        setSelectedTemporadaId(sortedTemporadas[0]._id);
      }
    } else {
      setSelectedTemporadaId(null);
    }
  }, [sortedTemporadas, selectedTemporadaId]);

  const t = useMemo(
    () => sortedTemporadas.find(temp => temp._id === selectedTemporadaId) || sortedTemporadas[0],
    [sortedTemporadas, selectedTemporadaId],
  );

  // ── Fase accordion ───────────────────────────────────────────────────────
  const [expandedFases, setExpandedFases] = useState<Record<string, boolean>>({});
  const toggleFase = (faseId: string) =>
    setExpandedFases(prev => ({ ...prev, [faseId]: !prev[faseId] }));

  // ── Stepper (computed) ───────────────────────────────────────────────────
  const stepperSteps = useMemo(() => {
    if (!t) return [];
    const equiposCount = (participacionesTemporadaPorId[t._id] || []).length;
    const fasesCount   = (fasesPorTemporada[t._id] || []).length;
    return [
      { label: 'Temporada creada', done: true },
      { label: `${equiposCount} equipo${equiposCount !== 1 ? 's' : ''} inscripto${equiposCount !== 1 ? 's' : ''}`, done: equiposCount > 0 },
      { label: `${fasesCount} fase${fasesCount !== 1 ? 's' : ''} definida${fasesCount !== 1 ? 's' : ''}`, done: fasesCount > 0 },
    ];
  }, [t, participacionesTemporadaPorId, fasesPorTemporada]);

  // ── Edit temporada modal ──────────────────────────────────────────────────
  const [editandoTemporada, setEditandoTemporada]         = useState<BackendTemporada | null>(null);
  const [nuevoNombreTemporada, setNuevoNombreTemporada]   = useState('');
  const [savingRenombre, setSavingRenombre]               = useState(false);

  // ── Finalizar / Reabrir fase ──────────────────────────────────────────────
  const [confirmFinalizarFase, setConfirmFinalizarFase] = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [confirmReabrirFase,   setConfirmReabrirFase]   = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [savingFaseAction, setSavingFaseAction]         = useState(false);

  // ── Other modals ──────────────────────────────────────────────────────────
  const [openCrearTemporada, setOpenCrearTemporada] = useState(false);
  const [openCrearFase, setOpenCrearFase] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openJugadores, setOpenJugadores] = useState<{ open: boolean; pt?: BackendParticipacionTemporada }>({ open: false });
  const [openGestionEquipos, setOpenGestionEquipos] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openGestionParticipantesFase, setOpenGestionParticipantesFase] = useState<{ open: boolean; fase?: BackendFase; temporadaId?: string }>({ open: false });
  const [openReglamento, setOpenReglamento] = useState<{ open: boolean; fase: BackendFase | null; temporadaId?: string }>({ open: false, fase: null });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Temporadas y fases</h2>
        <button
          type="button"
          disabled={!esAdmin}
          onClick={() => setOpenCrearTemporada(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <IconPlus />
          Nueva temporada
        </button>
      </div>

      {/* ── Temporada tabs ──────────────────────────────────────────────── */}
      {sortedTemporadas.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {sortedTemporadas.map(temp => {
            const isActive = (selectedTemporadaId ?? sortedTemporadas[0]?._id) === temp._id;
            return (
              <button
                key={temp._id}
                type="button"
                onClick={() => setSelectedTemporadaId(temp._id)}
                className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-100 text-brand-700 font-semibold'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {temp.nombre}
                {temp.fechaInicio && (
                  <span className="ml-1.5 text-[11px] opacity-60">
                    {new Date(temp.fechaInicio).getFullYear()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <section className="mt-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">Cargando…</div>
        ) : !t ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Sin temporadas</h3>
            <p className="mt-1 text-sm text-slate-500">Creá una temporada para empezar a organizar las fases y equipos.</p>
            <button
              type="button"
              disabled={!esAdmin}
              onClick={() => setOpenCrearTemporada(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              <IconPlus />
              Crear primera temporada
            </button>
          </div>
        ) : (
          /* ── Temporada card ───────────────────────────────────────────── */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Stepper */}
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3.5">
              <div className="flex items-center gap-2 sm:gap-5 overflow-x-auto scrollbar-hide">
                {stepperSteps.map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-2 shrink-0">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {step.done ? <IconCheck /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`text-xs whitespace-nowrap ${step.done ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                    {idx < stepperSteps.length - 1 && (
                      <div className="ml-1 h-px w-5 shrink-0 bg-slate-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Temporada info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-slate-900">{t.nombre}</h3>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {(participacionesTemporadaPorId[t._id] || []).length} equipo{(participacionesTemporadaPorId[t._id] || []).length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  disabled={!esAdmin}
                  onClick={() => setOpenGestionEquipos({ open: true, temporadaId: t._id })}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  Gestionar equipos →
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!esAdmin}
                  title="Editar nombre de temporada"
                  onClick={() => { setEditandoTemporada(t); setNuevoNombreTemporada(t.nombre); }}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                >
                  <IconPencil />
                </button>
                <button
                  type="button"
                  disabled={!esAdmin}
                  title="Eliminar temporada"
                  onClick={() => onEliminarTemporada(t)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                >
                  <IconTrash />
                </button>
              </div>
            </div>

            {/* Fases */}
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fases</h4>
                <button
                  type="button"
                  disabled={!esAdmin}
                  onClick={() => setOpenCrearFase({ open: true, temporadaId: t._id })}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <IconPlus />
                  Nueva fase
                </button>
              </div>

              {(fasesPorTemporada[t._id] || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                  <p className="text-sm text-slate-400">Aún no hay fases. Creá la primera para organizar los partidos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fasesPorTemporada[t._id].map(f => {
                    const participantesFase = participacionesFasePorId[f._id] || [];
                    const isExpanded    = expandedFases[f._id];
                    const esFinalizada  = f.estado === 'finalizada';
                    const esGrupoOLiga  = f.tipo === 'grupo' || f.tipo === 'liga';

                    return (
                      <div key={f._id} className="overflow-hidden rounded-xl border border-slate-200 transition-colors hover:border-slate-300">

                        {/* Fase header */}
                        <div
                          className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
                          onClick={() => toggleFase(f._id)}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="shrink-0 text-slate-400">
                              {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                            </span>
                            <span className="truncate font-semibold text-slate-900">{f.nombre ?? 'Fase'}</span>
                            <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tipoBadgeClass(f.tipo)}`}>
                              {f.tipo || 'otro'}
                            </span>
                            {esFinalizada && (
                              <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                finalizada
                              </span>
                            )}
                            <span className="shrink-0 text-xs text-slate-400">{participantesFase.length} eq.</span>
                          </div>

                          <div className="ml-2 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={!esAdmin}
                              title="Configurar reglamento"
                              onClick={() => setOpenReglamento({ open: true, fase: f, temporadaId: t._id })}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                            >
                              <IconCog />
                            </button>
                            <button
                              type="button"
                              disabled={!esAdmin}
                              title="Editar fase"
                              onClick={() => onEditarFase(f, t._id)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              disabled={!esAdmin}
                              title="Eliminar fase"
                              onClick={() => onEliminarFase(f, t._id)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>

                        {/* Fase expanded */}
                        {isExpanded && (
                          <div className="space-y-4 border-t border-slate-100 bg-white px-4 py-4">

                            {/* Actions row */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                disabled={!esAdmin}
                                onClick={() => setOpenGestionParticipantesFase({ open: true, fase: f, temporadaId: t._id })}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                              >
                                Gestionar participantes →
                              </button>

                              {esGrupoOLiga && esAdmin && (
                                esFinalizada ? (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmReabrirFase({ fase: f, temporadaId: t._id })}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-100"
                                  >
                                    Reabrir para corregir
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmFinalizarFase({ fase: f, temporadaId: t._id })}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100"
                                  >
                                    Finalizar y clasificar
                                  </button>
                                )
                              )}
                            </div>

                            {/* Content */}
                            {f.tipo === 'playoff' ? (
                              <div className="space-y-4">
                                <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Bracket</p>
                                  <PlayoffBracketOverview faseId={f._id} />
                                </div>
                                {participantesFase.length > 0 && (
                                  <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Participantes</p>
                                    <TablaPosiciones participaciones={mapParticipacionesFase(participantesFase)} />
                                  </div>
                                )}
                              </div>
                            ) : (
                              participantesFase.length > 0 && (
                                <TablaPosiciones participaciones={mapParticipacionesFase(participantesFase)} />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ══ Modals ══════════════════════════════════════════════════════════ */}

      {/* Renombrar temporada */}
      <ConfirmModal
        isOpen={!!editandoTemporada}
        title="Editar temporada"
        message={
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={nuevoNombreTemporada}
              onChange={e => setNuevoNombreTemporada(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.closest('form')?.requestSubmit();
              }}
            />
          </div> as any
        }
        confirmLabel={savingRenombre ? 'Guardando…' : 'Guardar'}
        variant="primary"
        onConfirm={async () => {
          if (!editandoTemporada || !nuevoNombreTemporada.trim()) return;
          setSavingRenombre(true);
          try {
            await onEditarTemporada(editandoTemporada, nuevoNombreTemporada.trim());
            setEditandoTemporada(null);
          } finally {
            setSavingRenombre(false);
          }
        }}
        onCancel={() => setEditandoTemporada(null)}
      />

      {/* Finalizar fase */}
      <ConfirmModal
        isOpen={!!confirmFinalizarFase}
        title="Finalizar fase"
        message={
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Se calcularán las posiciones finales y los equipos clasificarán a la siguiente fase según el reglamento.
            </p>
            <p className="text-xs text-slate-500">Esta acción puede deshacerse usando "Reabrir para corregir".</p>
          </div> as any
        }
        confirmLabel={savingFaseAction ? 'Finalizando…' : 'Finalizar y clasificar'}
        variant="primary"
        onConfirm={async () => {
          if (!confirmFinalizarFase) return;
          setSavingFaseAction(true);
          try {
            await finalizarFase(confirmFinalizarFase.fase._id);
            addToast({ type: 'success', title: 'Fase finalizada correctamente' });
            onRefresh?.();
            setConfirmFinalizarFase(null);
          } catch (err: any) {
            addToast({ type: 'error', title: 'Error al finalizar fase', message: err?.message });
          } finally {
            setSavingFaseAction(false);
          }
        }}
        onCancel={() => setConfirmFinalizarFase(null)}
      />

      {/* Reabrir fase */}
      <ConfirmModal
        isOpen={!!confirmReabrirFase}
        title="Reabrir fase"
        message={
          <div className="space-y-3">
            <p className="text-sm text-slate-700">La fase volverá al estado "en curso" y podrás volver a finalizarla.</p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Importante: eliminá manualmente los equipos en las fases de destino antes de volver a clasificarlos para evitar duplicados.
            </p>
          </div> as any
        }
        confirmLabel={savingFaseAction ? 'Reabriendo…' : 'Reabrir'}
        variant="default"
        onConfirm={async () => {
          if (!confirmReabrirFase) return;
          setSavingFaseAction(true);
          try {
            await onEditarFase(confirmReabrirFase.fase, confirmReabrirFase.temporadaId, { estado: 'en_curso' });
            addToast({ type: 'success', title: 'Fase reabierta' });
            setConfirmReabrirFase(null);
          } catch {
            addToast({ type: 'error', title: 'Error al reabrir la fase' });
          } finally {
            setSavingFaseAction(false);
          }
        }}
        onCancel={() => setConfirmReabrirFase(null)}
      />

      {/* Crear temporada */}
      <CrearTemporadaModal
        isOpen={openCrearTemporada}
        onClose={() => setOpenCrearTemporada(false)}
        onSubmit={onSubmitCrearTemporada}
      />

      {/* Crear fase */}
      <CrearFaseModal
        isOpen={openCrearFase.open}
        onClose={() => setOpenCrearFase({ open: false })}
        onSubmit={payload => {
          if (openCrearFase.temporadaId) {
            void Promise.resolve(onSubmitCrearFase(openCrearFase.temporadaId, payload)).then(() => {
              setOpenCrearFase({ open: false });
            });
          }
        }}
      />

      {/* Jugadores */}
      <JugadoresTemporadaModal
        isOpen={openJugadores.open}
        onClose={() => setOpenJugadores({ open: false })}
        participacion={openJugadores.pt}
      />

      {/* Gestión equipos temporada */}
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
        onOpenJugadores={pt => setOpenJugadores({ open: true, pt })}
      />

      {/* Gestión participantes fase */}
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
        onGenerarLlave={faseId => onGenerarFixture(faseId)}
      />

      {/* Reglamento */}
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
