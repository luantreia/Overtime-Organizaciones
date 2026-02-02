import { useState, useMemo, useEffect } from 'react';
import type { BackendTemporada, BackendFase, BackendParticipacionTemporada, BackendParticipacionFase } from '../services';
import CrearTemporadaModal from '../modals/CrearTemporadaModal';
import CrearFaseModal from '../modals/CrearFaseModal';
import JugadoresTemporadaModal from '../modals/JugadoresTemporadaModal';
import GestionEquiposTemporadaModal from '../modals/GestionEquiposTemporadaModal';
import GestionParticipantesFaseModal from '../modals/GestionFaseModal';
import { TablaPosiciones } from '../../../shared/components/TablaPosiciones';

type Props = {
  esAdmin: boolean;
  loading: boolean;
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
    }
  ) => void | Promise<void>;
  onEditarTemporada: (t: BackendTemporada) => void;
  onEliminarTemporada: (t: BackendTemporada) => void;
  onGenerarFixture: (faseId: string) => void;
  onEditarFase: (fase: BackendFase, temporadaId: string) => void;
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

  const [openCrearTemporada, setOpenCrearTemporada] = useState(false);
  const [openCrearFase, setOpenCrearFase] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openJugadores, setOpenJugadores] = useState<{ open: boolean; pt?: BackendParticipacionTemporada }>( { open: false });
  const [openGestionEquipos, setOpenGestionEquipos] = useState<{ open: boolean; temporadaId?: string }>({ open: false });
  const [openGestionParticipantesFase, setOpenGestionParticipantesFase] = useState<{ open: boolean; fase?: BackendFase; temporadaId?: string }>({ open: false });

  

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
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">Sin temporadas</p>
        ) : (
          <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{t.nombre}</h3>
              <div className="flex flex-wrap gap-2">
                <button disabled={!esAdmin} className="flex-1 sm:flex-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-center" onClick={() => setOpenCrearFase({ open: true, temporadaId: t._id })}>Crear fase</button>
                <button disabled={!esAdmin} className="flex-1 sm:flex-none rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-center" onClick={() => onEditarTemporada(t)}>Editar</button>
                <button disabled={!esAdmin} className="flex-1 sm:flex-none rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 text-center" onClick={() => onEliminarTemporada(t)}>Eliminar</button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{(participacionesTemporadaPorId[t._id] || []).length} equipos</span>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={()=> setOpenGestionEquipos({ open: true, temporadaId: t._id })} disabled={!esAdmin}>Gestionar</button>
              </div>
            </div>

            <h4 className="text-sm font-medium text-slate-800">Fases</h4>
            <ul className="mt-2 divide-y divide-slate-200">
              {(fasesPorTemporada[t._id] || []).map((f) => (
                <li key={f._id} className="py-2 text-sm">
                  <div className="flex flex-col gap-2 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{f.nombre ?? 'Fase'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <button disabled={!esAdmin} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-center" onClick={() => onGenerarFixture(f._id)}>Generar fixture</button>
                      <button disabled={!esAdmin} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-center" onClick={() => onEditarFase(f, t._id)}>Editar</button>
                      <button disabled={!esAdmin} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 text-center" onClick={() => onEliminarFase(f, t._id)}>Eliminar</button>
                      <button disabled={!esAdmin} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-center" onClick={() => setOpenGestionParticipantesFase({ open: true, fase: f, temporadaId: t._id })}>Gestionar</button>
                    </div>
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
                  {/* Participantes y altas gestionados por modal */}
                </li>
              ))}
              {(fasesPorTemporada[t._id] || []).length === 0 ? (
                <li className="py-2 text-xs text-slate-500">Sin fases</li>
              ) : null}
            </ul>
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
        fase={openGestionParticipantesFase.fase}
        temporadaId={openGestionParticipantesFase.temporadaId}
        participantesFase={openGestionParticipantesFase.fase ? (participacionesFasePorId[openGestionParticipantesFase.fase._id] || []) : []}
        participantesTemporada={openGestionParticipantesFase.temporadaId ? (participacionesTemporadaPorId[openGestionParticipantesFase.temporadaId] || []) : []}
        onAgregar={onCrearParticipacionFase}
        onGenerarLlave={(faseId) => onGenerarFixture(faseId)}
      />
    </>
  );
}
