import { useState, useMemo, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/20/solid';
import type { BackendTemporada, BackendFase, BackendParticipacionTemporada, BackendParticipacionFase } from '../services';
import { finalizarFase } from '../services';
import { opcionesEquiposParaTemporada, type EquipoDisponibleOpcion } from '../services/participacionTemporadaService';
import CrearTemporadaModal from '../modals/CrearTemporadaModal';
import CrearFaseModal from '../modals/CrearFaseModal';
import JugadoresTemporadaModal from '../modals/JugadoresTemporadaModal';
import GestionEquiposTemporadaModal from '../modals/GestionEquiposTemporadaModal';
import GestionParticipantesFaseModal from '../modals/GestionFaseModal';
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

const IconStar = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
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
  competenciaId: string;
  organizacionId?: string;
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
  onEditarTemporada: (t: BackendTemporada, payload: { nombre?: string; fechaInicio?: string; fechaFin?: string; estado?: string }) => void | Promise<void>;
  onAsignarCampeon: (temporadaId: string, ganadorId: string | null) => void | Promise<void>;
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
    esAdmin, loading, competenciaId, organizacionId, onRefresh,
    onSubmitCrearTemporada, temporadas, fasesPorTemporada, onSubmitCrearFase,
    onEditarTemporada, onAsignarCampeon, onEliminarTemporada, onGenerarFixture,
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
  const [editFechaInicio, setEditFechaInicio]             = useState('');
  const [editFechaFin, setEditFechaFin]                   = useState('');
  const [editEstado, setEditEstado]                       = useState('');
  const [savingRenombre, setSavingRenombre]               = useState(false);

  // ── Asignar campeón modal ─────────────────────────────────────────────────
  const [asignandoCampeon, setAsignandoCampeon]           = useState<BackendTemporada | null>(null);
  const [campeonId, setCampeonId]                         = useState('');
  const [campeonSearch, setCampeonSearch]                 = useState('');
  const [campeonOptions, setCampeonOptions]               = useState<EquipoDisponibleOpcion[]>([]);
  const [savingCampeon, setSavingCampeon]                 = useState(false);

  const openAsignarCampeon = (temp: BackendTemporada) => {
    setAsignandoCampeon(temp);
    const id = typeof temp.ganador === 'string' ? temp.ganador : (temp.ganador as any)?._id ?? '';
    setCampeonId(id);
    setCampeonSearch('');
    setCampeonOptions([]);
  };

  // ── Finalizar / Reabrir fase ──────────────────────────────────────────────
  const [confirmFinalizarFase, setConfirmFinalizarFase] = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [confirmReabrirFase,   setConfirmReabrirFase]   = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [reabrirFaseRiesgoAceptado, setReabrirFaseRiesgoAceptado] = useState(false);
  const [savingFaseAction, setSavingFaseAction]         = useState(false);

  // ── Other modals ──────────────────────────────────────────────────────────
  const [openCrearTemporada, setOpenCrearTemporada] = useState(false);
  const [openCrearFase, setOpenCrearFase] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openJugadores, setOpenJugadores] = useState<{ open: boolean; pt?: BackendParticipacionTemporada }>({ open: false });
  const [openGestionEquipos, setOpenGestionEquipos] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openGestionParticipantesFase, setOpenGestionParticipantesFase] = useState<{ open: boolean; fase?: BackendFase; temporadaId?: string }>({ open: false });

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
                {temp.ganador && <span className="mr-1 text-amber-500">★</span>}
                {temp.nombre}
                {temp.fechaInicio && (
                  <span className="ml-1.5 text-[11px] opacity-60">
                    {new Date(temp.fechaInicio).getFullYear()}
                  </span>
                )}
                {temp.estado === 'finalizada' && (
                  <span className="ml-1.5 text-[11px] opacity-60">· fin.</span>
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
                {t.estado === 'finalizada' && (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Finalizada
                  </span>
                )}
                {t.estado === 'en_curso' && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    En curso
                  </span>
                )}
                {t.ganador && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <IconStar />
                    {typeof t.ganador === 'string' ? 'Campeón asignado' : ((t.ganador as any).nombre ?? 'Campeón')}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {(participacionesTemporadaPorId[t._id] || []).length} equipo{(participacionesTemporadaPorId[t._id] || []).length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  disabled={!esAdmin}
                  onClick={() => setOpenGestionEquipos({ open: true, temporadaId: t._id })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Gestionar equipos de la temporada →
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!esAdmin}
                  title="Asignar campeón"
                  onClick={() => openAsignarCampeon(t)}
                  className={`rounded-lg p-1.5 transition-colors disabled:opacity-40 ${
                    t.ganador
                      ? 'text-amber-500 hover:bg-amber-50'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <IconStar />
                </button>
                <button
                  type="button"
                  disabled={!esAdmin}
                  title="Editar temporada"
                  onClick={() => {
                    setEditandoTemporada(t);
                    setNuevoNombreTemporada(t.nombre);
                    setEditFechaInicio(t.fechaInicio ? t.fechaInicio.slice(0, 10) : '');
                    setEditFechaFin(t.fechaFin ? t.fechaFin.slice(0, 10) : '');
                    setEditEstado(t.estado || 'en_creacion');
                  }}
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
                                Gestionar fase →
                              </button>

                              {esGrupoOLiga && esAdmin && (
                                esFinalizada ? (
                                  <button
                                    type="button"
                                    onClick={() => { setReabrirFaseRiesgoAceptado(false); setConfirmReabrirFase({ fase: f, temporadaId: t._id }); }}
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

      {/* Editar temporada */}
      <ConfirmModal
        isOpen={!!editandoTemporada}
        title="Editar temporada"
        message={
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={nuevoNombreTemporada}
                onChange={e => setNuevoNombreTemporada(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Inicio</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={editFechaInicio}
                  onChange={e => setEditFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Fin</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={editFechaFin}
                  onChange={e => setEditFechaFin(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={editEstado}
                onChange={e => setEditEstado(e.target.value)}
              >
                <option value="en_creacion">En creación</option>
                <option value="en_curso">En curso</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div> as any
        }
        confirmLabel={savingRenombre ? 'Guardando…' : 'Guardar'}
        variant="primary"
        onConfirm={async () => {
          if (!editandoTemporada || !nuevoNombreTemporada.trim()) return;
          setSavingRenombre(true);
          try {
            await onEditarTemporada(editandoTemporada, {
              nombre: nuevoNombreTemporada.trim(),
              fechaInicio: editFechaInicio || undefined,
              fechaFin: editFechaFin || undefined,
              estado: editEstado || undefined,
            });
            setEditandoTemporada(null);
          } finally {
            setSavingRenombre(false);
          }
        }}
        onCancel={() => setEditandoTemporada(null)}
      />

      {/* Asignar campeón */}
      <ConfirmModal
        isOpen={!!asignandoCampeon}
        title="Asignar campeón"
        message={
          <div className="space-y-4">
            {/* Equipos inscriptos */}
            {asignandoCampeon && (participacionesTemporadaPorId[asignandoCampeon._id] || []).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Equipos participantes</p>
                <div className="max-h-44 space-y-1 overflow-y-auto">
                  {(participacionesTemporadaPorId[asignandoCampeon._id] || []).map(pt => {
                    const eqId   = typeof pt.equipo === 'string' ? pt.equipo : ((pt.equipo as any)?._id ?? '');
                    const nombre = typeof pt.equipo === 'string' ? '' : ((pt.equipo as any)?.nombre ?? '');
                    const isSelected = campeonId === eqId;
                    return (
                      <button
                        key={pt._id}
                        type="button"
                        onClick={() => { setCampeonId(eqId); setCampeonSearch(''); setCampeonOptions([]); }}
                        className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50 font-semibold text-amber-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-base ${isSelected ? 'opacity-100' : 'opacity-0'}`}>★</span>
                        {nombre || eqId.slice(-6)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Búsqueda libre */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Buscar otro equipo</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nombre del equipo…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={campeonSearch}
                  onChange={async e => {
                    setCampeonSearch(e.target.value);
                    if (e.target.value.trim().length >= 2 && asignandoCampeon) {
                      const opts = await opcionesEquiposParaTemporada(asignandoCampeon._id, e.target.value.trim());
                      setCampeonOptions(opts);
                    } else {
                      setCampeonOptions([]);
                    }
                  }}
                />
                {campeonOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-32 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {campeonOptions.map(opt => (
                      <button
                        key={opt._id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        onClick={() => { setCampeonId(opt._id); setCampeonSearch(opt.nombre || ''); setCampeonOptions([]); }}
                      >
                        <span className="font-medium">{opt.nombre}</span>
                        {opt.pais && <span className="ml-2 text-[10px] text-slate-400 uppercase">{opt.pais}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quitar campeón */}
            {campeonId && (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                onClick={() => setCampeonId('')}
              >
                × Quitar campeón asignado
              </button>
            )}
          </div> as any
        }
        confirmLabel={savingCampeon ? 'Guardando…' : 'Guardar'}
        variant="primary"
        onConfirm={async () => {
          if (!asignandoCampeon) return;
          setSavingCampeon(true);
          try {
            await onAsignarCampeon(asignandoCampeon._id, campeonId || null);
            setAsignandoCampeon(null);
          } catch (err: any) {
            addToast({ type: 'error', title: 'Error al guardar', message: err?.message });
          } finally {
            setSavingCampeon(false);
          }
        }}
        onCancel={() => setAsignandoCampeon(null)}
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
              Importante: eliminá manualmente los equipos en las fases de destino antes de volver a clasificarlos, o quedarán duplicados.
            </p>
            <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={reabrirFaseRiesgoAceptado}
                onChange={(e) => setReabrirFaseRiesgoAceptado(e.target.checked)}
              />
              Entiendo el riesgo de duplicados y ya revisé las fases de destino.
            </label>
          </div> as any
        }
        confirmLabel={savingFaseAction ? 'Reabriendo…' : 'Reabrir'}
        variant="danger"
        onConfirm={async () => {
          if (!confirmReabrirFase) return;
          if (!reabrirFaseRiesgoAceptado) {
            addToast({ type: 'error', title: 'Confirmá que revisaste el riesgo antes de continuar' });
            return;
          }
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
        competenciaId={competenciaId}
        organizacionId={organizacionId}
        temporadaId={openGestionEquipos.temporadaId || ''}
        participaciones={openGestionEquipos.temporadaId ? (participacionesTemporadaPorId[openGestionEquipos.temporadaId] || []) : []}
        onUpdateParticipacionTemporada={onUpdateParticipacionTemporada}
        onDeleteParticipacionTemporada={onDeleteParticipacionTemporada}
        onCrearSolicitudParticipacionTemporada={onCrearSolicitudParticipacionTemporada}
        onOpenJugadores={pt => setOpenJugadores({ open: true, pt })}
      />

      {/* Gestión de fase (participantes, calendario, configuración y reglamento) */}
      <GestionParticipantesFaseModal
        isOpen={openGestionParticipantesFase.open}
        onClose={() => setOpenGestionParticipantesFase({ open: false })}
        esAdmin={esAdmin}
        onRefresh={onRefresh}
        fase={openGestionParticipantesFase.fase}
        temporadaId={openGestionParticipantesFase.temporadaId}
        todasLasFases={openGestionParticipantesFase.temporadaId ? (fasesPorTemporada[openGestionParticipantesFase.temporadaId] || []) : []}
        participantesFase={openGestionParticipantesFase.fase ? (participacionesFasePorId[openGestionParticipantesFase.fase._id] || []) : []}
        participantesTemporada={openGestionParticipantesFase.temporadaId ? (participacionesTemporadaPorId[openGestionParticipantesFase.temporadaId] || []) : []}
        onAgregar={onCrearParticipacionFase}
        onGenerarLlave={faseId => onGenerarFixture(faseId)}
        onEditarFase={onEditarFase}
      />
    </>
  );
}
