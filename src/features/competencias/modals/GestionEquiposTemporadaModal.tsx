import { useState, useEffect, useCallback } from 'react';
import {
  BellAlertIcon,
  BuildingOffice2Icon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendParticipacionTemporada } from '../services';
import { opcionesEquiposParaTemporada, type EquipoDisponibleOpcion } from '../services/participacionTemporadaService';
import { getEquiposAceptadosPorCompetencia, getEquiposDeOrganizacion, type EquipoCompetenciaVinculo } from '../services/equipoCompetenciaOrgService';
import { getSolicitudesEdicion, actualizarSolicitudEdicion } from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import type { SolicitudEdicion, ISolicitudEdicion } from '../../../shared/features/solicitudes/types/solicitudesEdicion';
import { crearSolicitudEdicion } from '../../../shared/features/solicitudes';
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
  onCrearSolicitudParticipacionTemporada: (temporadaId: string, equipoId: string) => void | Promise<void>;
  onOpenJugadores: (pt: BackendParticipacionTemporada) => void;
  onRefresh?: () => void | Promise<void>;
};

function Avatar({ nombre }: { nombre: string }) {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function SectionHeader({ icon, children, count, tone = 'slate' }: { icon: React.ReactNode; children: React.ReactNode; count?: number; tone?: 'slate' | 'brand' }) {
  const toneClass = tone === 'brand' ? 'text-brand-700' : 'text-slate-500';
  return (
    <h4 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${toneClass}`}>
      {icon}
      {children}
      {typeof count === 'number' && (
        <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-black normal-case tracking-normal ${tone === 'brand' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
          {count}
        </span>
      )}
    </h4>
  );
}

export default function GestionEquiposTemporadaModal({
  isOpen,
  onClose,
  esAdmin,
  competenciaId,
  temporadaId,
  organizacionId,
  participaciones,
  onUpdateParticipacionTemporada,
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
  const [bajaSolicitada, setBajaSolicitada] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const handleSolicitarBaja = async (participacionId: string, nombre: string) => {
    try {
      await crearSolicitudEdicion({
        tipo: 'participacion-temporada-eliminar',
        datosPropuestos: { participacionTemporadaId: participacionId, equipoNombre: nombre, temporadaId },
      });
      setBajaSolicitada((prev) => new Set(prev).add(participacionId));
      addToast({
        type: 'success',
        title: 'Solicitud de baja enviada',
        message: `Se pidió sacar a ${nombre} de la temporada — requiere doble confirmación de un admin.`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

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
      size="xl"
      message={
        <div className="space-y-6">
          {/* Solicitudes que el DT inició — yo puedo aprobar */}
          {solicitudesAprobables.length > 0 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4">
              <SectionHeader icon={<BellAlertIcon className="h-4 w-4" />} count={solicitudesAprobables.length} tone="brand">
                Solicitudes de ingreso pendientes
              </SectionHeader>
              <ul className="mt-3 space-y-2">
                {solicitudesAprobables.map((s) => (
                  <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nombre={s.datosPropuestos?.equipoNombre || 'Equipo'} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-bold leading-tight text-slate-900">
                          {s.datosPropuestos?.equipoNombre || s.datosPropuestos?.equipoId || 'Equipo'}
                        </span>
                        <span className="text-[10px] font-medium uppercase text-slate-500">
                          Solicitado {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        onClick={() => handleResolverSolicitud(s.id, 'aceptado')}
                        disabled={!esAdmin}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
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
              <SectionHeader icon={<ClockIcon className="h-4 w-4" />} count={solicitudesPropias.length}>
                Esperando confirmación del equipo
              </SectionHeader>
              <ul className="mt-3 space-y-2">
                {solicitudesPropias.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nombre={s.datosPropuestos?.equipoNombre || 'Equipo'} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-bold leading-tight text-slate-700">
                          {s.datosPropuestos?.equipoNombre || s.datosPropuestos?.equipoId || 'Equipo'}
                        </span>
                        <span className="text-[10px] font-medium uppercase text-slate-400">
                          Enviado {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Pendiente
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <SectionHeader icon={<UserGroupIcon className="h-4 w-4" />} count={participaciones.length}>
              Equipos participantes
            </SectionHeader>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {participaciones.map((pt) => {
                const nombre = typeof pt.equipo === 'string' ? pt.equipo : (pt.equipo?.nombre ?? pt._id);
                return (
                  <li key={pt._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar nombre={nombre} />
                      <span className="truncate text-sm font-medium text-slate-700">{nombre}</span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                        defaultValue={(pt as any).estado || 'activo'}
                        onChange={(e) => { void onUpdateParticipacionTemporada(pt._id, { estado: e.target.value }); }}
                        disabled={!esAdmin}
                      >
                        <option value="activo">Activo</option>
                        <option value="baja">Baja</option>
                        <option value="expulsado">Expulsado</option>
                      </select>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        onClick={() => onOpenJugadores(pt)}
                        disabled={!esAdmin}
                      >
                        Jugadores
                      </button>
                      <button
                        type="button"
                        title={bajaSolicitada.has(pt._id) ? 'Solicitud de baja ya enviada' : 'Solicitar eliminación de la temporada (requiere doble confirmación)'}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        onClick={() => handleSolicitarBaja(pt._id, nombre)}
                        disabled={!esAdmin || bajaSolicitada.has(pt._id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
              {participaciones.length === 0 && !loadingSolicitudes && (
                <li className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                  <p className="text-xs font-medium text-slate-400">No hay equipos activos en esta temporada</p>
                </li>
              )}
              {loadingSolicitudes && <li className="animate-pulse py-4 text-center text-xs text-slate-400">Buscando solicitudes...</li>}
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
                <SectionHeader icon={<SparklesIcon className="h-4 w-4" />} tone="brand">
                  Equipos de la competencia — agregar a temporada
                </SectionHeader>
                <div className="mt-3 flex flex-wrap gap-2">
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
                <SectionHeader icon={<BuildingOffice2Icon className="h-4 w-4" />}>
                  Otros equipos de la organización
                </SectionHeader>
                <div className="mt-3 flex flex-wrap gap-2">
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
            <SectionHeader icon={<MagnifyingGlassIcon className="h-4 w-4" />}>
              Inscripción manual
            </SectionHeader>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <div className="relative sm:col-span-3">
                <input
                  type="text"
                  placeholder="Buscar equipo por nombre..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  value={equipoSearch}
                  onChange={(e) => { void buscarEquipos(e.target.value); }}
                  disabled={!esAdmin}
                />
                {equipoOptions.length > 0 ? (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {equipoOptions.map((opt) => (
                      <button
                        key={opt._id}
                        type="button"
                        className="block w-full border-b border-slate-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50"
                        onClick={() => {
                          setEquipoSeleccionado({ id: opt._id, nombre: opt.nombre });
                          setEquipoSearch(opt.nombre || '');
                          setEquipoOptions([]);
                        }}
                      >
                        <span className="font-medium text-slate-900">{opt.nombre}</span>
                        {opt.pais && <span className="ml-2 text-[10px] uppercase text-slate-400">{opt.pais}</span>}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-30"
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
