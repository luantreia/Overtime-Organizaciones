import { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendParticipacionTemporada } from '../services';
import { opcionesEquiposParaTemporada, type EquipoDisponibleOpcion } from '../services/participacionTemporadaService';
import { getEquiposAceptadosPorCompetencia, getEquiposDeOrganizacion, type EquipoCompetenciaVinculo } from '../services/equipoCompetenciaOrgService';
import { getSolicitudesEdicion, actualizarSolicitudEdicion } from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import type { SolicitudEdicion, ISolicitudEdicion } from '../../../shared/features/solicitudes/types/solicitudesEdicion';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  esAdmin: boolean;
  competenciaId: string;
  temporadaId: string;
  organizacionId?: string;
  participaciones: BackendParticipacionTemporada[];
  onUpdateParticipacionTemporada: (id: string, body: Partial<{ estado: string }>) => void | Promise<void>;
  onDeleteParticipacionTemporada: (id: string, temporadaId: string) => void | Promise<void>;
  onCrearSolicitudParticipacionTemporada: (temporadaId: string, equipoId: string) => void | Promise<void>;
  onOpenJugadores: (pt: BackendParticipacionTemporada) => void;
  onRefresh?: () => void | Promise<void>;
};

export default function GestionEquiposTemporadaModal({
  isOpen,
  onClose,
  esAdmin,
  competenciaId,
  temporadaId,
  organizacionId,
  participaciones,
  onUpdateParticipacionTemporada,
  onDeleteParticipacionTemporada,
  onCrearSolicitudParticipacionTemporada,
  onOpenJugadores,
  onRefresh
}: Props) {
  const [equipoSearch, setEquipoSearch] = useState('');
  const [equipoOptions, setEquipoOptions] = useState<EquipoDisponibleOpcion[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{ id: string; nombre: string } | null>(null);
  const [solicitudesAprobables, setSolicitudesAprobables] = useState<SolicitudEdicion[]>([]);
  const [solicitudesPropias, setSolicitudesPropias] = useState<SolicitudEdicion[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [sugeridos, setSugeridos] = useState<EquipoCompetenciaVinculo[]>([]);
  const [sugeridosOrg, setSugeridosOrg] = useState<EquipoCompetenciaVinculo[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);
  const { addToast } = useToast();

  const cargarSolicitudes = useCallback(async () => {
    if (!temporadaId || !isOpen) return;
    try {
      setLoadingSolicitudes(true);
      const [aprobables, propias] = await Promise.all([
        getSolicitudesEdicion({ tipo: 'participacion-temporada-crear', estado: 'pendiente', scope: 'aprobables' } as any),
        getSolicitudesEdicion({ tipo: 'participacion-temporada-crear', estado: 'pendiente', scope: 'mine' } as any),
      ]);
      const porTemporada = (s: ISolicitudEdicion) => s.datosPropuestos?.temporadaId === temporadaId;
      setSolicitudesAprobables(aprobables.solicitudes.filter(porTemporada).map(s => ({ ...s, id: s._id })));
      setSolicitudesPropias(propias.solicitudes.filter(porTemporada).map(s => ({ ...s, id: s._id })));
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoadingSolicitudes(false);
    }
  }, [temporadaId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      cargarSolicitudes();
      if (competenciaId) {
        getEquiposAceptadosPorCompetencia(competenciaId)
          .then(setSugeridos)
          .catch(() => setSugeridos([]));
      }
      if (organizacionId) {
        getEquiposDeOrganizacion(organizacionId, competenciaId)
          .then(setSugeridosOrg)
          .catch(() => setSugeridosOrg([]));
      }
    }
  }, [isOpen, cargarSolicitudes, competenciaId, organizacionId]);

  const handleResolverSolicitud = async (id: string, estado: 'aceptado' | 'rechazado') => {
    try {
      await actualizarSolicitudEdicion(id, { estado });
      addToast({ type: 'success', title: estado === 'aceptado' ? 'Solicitud aprobada' : 'Solicitud rechazada' });
      await cargarSolicitudes();
      if (estado === 'aceptado' && onRefresh) await onRefresh();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

  const buscarEquipos = async (query: string) => {
    setEquipoSearch(query);
    if (!query || query.trim().length < 2) {
      setEquipoOptions([]);
      return;
    }
    if (!temporadaId) return;
    const opts = await opcionesEquiposParaTemporada(temporadaId, query.trim());
    setEquipoOptions(opts);
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Equipos en temporada"
      message={
        <div className="space-y-6">
          {/* Solicitudes que el DT inició — yo puedo aprobar */}
          {solicitudesAprobables.length > 0 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-brand-700 uppercase tracking-tight mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px]">
                  {solicitudesAprobables.length}
                </span>
                Solicitudes de ingreso pendientes
              </h4>
              <ul className="space-y-2">
                {solicitudesAprobables.map((s) => (
                  <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-brand-100 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 leading-tight">
                        {s.datosPropuestos?.equipoNombre || s.datosPropuestos?.equipoId || 'Equipo'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">
                        Solicitado {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition shadow-sm"
                        onClick={() => handleResolverSolicitud(s.id, 'aceptado')}
                        disabled={!esAdmin}
                      >
                        Aprobar
                      </button>
                      <button
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition"
                        onClick={() => handleResolverSolicitud(s.id, 'rechazado')}
                        disabled={!esAdmin}
                      >
                        Rechazar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inscripciones que yo inicié — esperando confirmación del equipo */}
          {solicitudesPropias.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-tight mb-3">
                Esperando confirmación del equipo
              </h4>
              <ul className="space-y-2">
                {solicitudesPropias.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 leading-tight">
                        {s.datosPropuestos?.equipoNombre || s.datosPropuestos?.equipoId || 'Equipo'}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Enviado {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wide border border-amber-100">
                      Pendiente
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipos participantes</h4>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {participaciones.map((pt) => (
                <li key={pt._id} className="py-3 text-sm flex items-center justify-between gap-2">
                  <div className="min-w-0 font-medium text-slate-700">
                    {typeof pt.equipo === 'string' ? pt.equipo : (pt.equipo?.nombre ?? pt._id)}
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500" defaultValue={(pt as any).estado || 'activo'} onChange={(e)=>{ void onUpdateParticipacionTemporada(pt._id, { estado: e.target.value }); }} disabled={!esAdmin}>
                      <option value="activo">Activo</option>
                      <option value="baja">Baja</option>
                      <option value="expulsado">Expulsado</option>
                    </select>
                    <button type="button" className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition" onClick={()=> onOpenJugadores(pt)} disabled={!esAdmin}>Jugadores</button>
                    <button type="button" className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" onClick={()=>{ void onDeleteParticipacionTemporada(pt._id, temporadaId); }} disabled={!esAdmin}>🗑️</button>
                  </div>
                </li>
              ))}
              {participaciones.length === 0 && !loadingSolicitudes && (
                <li className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mt-2">
                  <p className="text-xs text-slate-400 font-medium">No hay equipos activos en esta temporada</p>
                </li>
              )}
              {loadingSolicitudes && <li className="py-4 text-center text-xs text-slate-400 animate-pulse">Buscando solicitudes...</li>}
            </ul>
          </div>

          {/* Sugeridos de la competencia */}
          {(() => {
            const yaInscritos = new Set(participaciones.map(pt =>
              typeof pt.equipo === 'string' ? pt.equipo : ((pt.equipo as any)?._id ?? '')
            ));
            const disponibles = sugeridos.filter(ec => {
              const id = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?._id ?? '');
              return id && !yaInscritos.has(id);
            });
            if (disponibles.length === 0) return null;
            return (
              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">
                  Equipos de la competencia — agregar a temporada
                </h4>
                <div className="flex flex-wrap gap-2">
                  {disponibles.map(ec => {
                    const eqId   = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?._id ?? '');
                    const nombre = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?.nombre ?? 'Equipo');
                    const isSending = enviando === eqId;
                    return (
                      <button
                        key={ec._id}
                        type="button"
                        disabled={!esAdmin || isSending}
                        onClick={async () => {
                          if (!eqId) return;
                          setEnviando(eqId);
                          try {
                            await onCrearSolicitudParticipacionTemporada(temporadaId, eqId);
                            setSugeridos(prev => prev.filter(s => {
                              const sid = typeof s.equipo === 'string' ? s.equipo : ((s.equipo as any)?._id ?? '');
                              return sid !== eqId;
                            }));
                          } finally {
                            setEnviando(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-50"
                      >
                        {isSending ? '…' : '+ '}{nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Sugeridos de otras competencias de la organización */}
          {(() => {
            const yaInscritos = new Set(participaciones.map(pt =>
              typeof pt.equipo === 'string' ? pt.equipo : ((pt.equipo as any)?._id ?? '')
            ));
            const yaEnComp = new Set(sugeridos.map(ec =>
              typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?._id ?? '')
            ));
            const disponibles = sugeridosOrg.filter(ec => {
              const eqId = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?._id ?? '');
              return eqId && !yaInscritos.has(eqId) && !yaEnComp.has(eqId);
            });
            if (disponibles.length === 0) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Otros equipos de la organización
                </h4>
                <div className="flex flex-wrap gap-2">
                  {disponibles.map(ec => {
                    const eqId   = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?._id ?? '');
                    const nombre = typeof ec.equipo === 'string' ? ec.equipo : ((ec.equipo as any)?.nombre ?? 'Equipo');
                    const isSending = enviando === eqId;
                    return (
                      <button
                        key={ec._id}
                        type="button"
                        disabled={!esAdmin || isSending}
                        onClick={async () => {
                          if (!eqId) return;
                          setEnviando(eqId);
                          try {
                            await onCrearSolicitudParticipacionTemporada(temporadaId, eqId);
                            setSugeridosOrg(prev => prev.filter(s => {
                              const sid = typeof s.equipo === 'string' ? s.equipo : ((s.equipo as any)?._id ?? '');
                              return sid !== eqId;
                            }));
                          } finally {
                            setEnviando(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {isSending ? '…' : '+ '}{nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Inscripción manual</h4>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Buscar equipo por nombre..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  value={equipoSearch}
                  onChange={(e) => { void buscarEquipos(e.target.value); }}
                  disabled={!esAdmin}
                />
                {equipoOptions.length > 0 ? (
                  <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg absolute z-10 w-[280px]">
                    {equipoOptions.map((opt) => (
                      <button
                        key={opt._id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setEquipoSeleccionado({ id: opt._id, nombre: opt.nombre });
                          setEquipoSearch(opt.nombre || '');
                          setEquipoOptions([]);
                        }}
                      >
                        <span className="font-medium text-slate-900">{opt.nombre}</span>
                        {opt.pais && <span className="ml-2 text-[10px] text-slate-400 uppercase">{opt.pais}</span>}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-30 transition shadow-sm"
                disabled={!esAdmin || !equipoSeleccionado?.id}
                onClick={() => {
                  if (!equipoSeleccionado) return;
                  void onCrearSolicitudParticipacionTemporada(temporadaId, equipoSeleccionado.id);
                  setEquipoSeleccionado(null);
                  setEquipoSearch('');
                }}
              >
                Inscribir
              </button>
            </div>
          </div>
        </div> as any
      }
      onCancel={onClose}
      onConfirm={onClose}
      confirmLabel="Cerrar"
      showCancel={false}
      variant="primary"
    />
  );
}
