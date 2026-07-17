import { useEffect, useMemo, useState } from 'react';
import { TrashIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import type { BackendParticipacionTemporada } from '../services';
import { listJugadorTemporadaByParticipacion, updateJugadorTemporada, type BackendJugadorTemporada, opcionesJugadorTemporada, type JugadorEquipoOpcion } from '../services/jugadorTemporadaService';
import { crearSolicitudEdicion } from '../../../shared/features/solicitudes';

// NOTE: Para agregar jugadores a la temporada, se pueden seleccionar múltiples jugadores
// y crear solicitudes que deben ser aprobadas por los administradores

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participacion?: BackendParticipacionTemporada;
};

function Avatar({ nombre }: { nombre: string }) {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function SectionHeader({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
      {icon}
      {children}
      {typeof count === 'number' && (
        <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-black normal-case tracking-normal text-slate-600">
          {count}
        </span>
      )}
    </h4>
  );
}

const estadoLabel: Record<string, string> = { aceptado: 'Aceptado', baja: 'Baja', suspendido: 'Suspendido' };
const rolLabel: Record<string, string> = { jugador: 'Jugador', entrenador: 'Entrenador' };

export default function JugadoresTemporadaModal({ isOpen, onClose, participacion }: Props) {
  const [items, setItems] = useState<BackendJugadorTemporada[]>([]);
  const [loading, setLoading] = useState(false);
  const [opciones, setOpciones] = useState<JugadorEquipoOpcion[]>([]);
  const [opcionesLoading, setOpcionesLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<'aceptado' | 'baja' | 'suspendido'>('aceptado');
  const [rol, setRol] = useState<'jugador' | 'entrenador'>('jugador');
  const [bajaSolicitada, setBajaSolicitada] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const handleSolicitarBaja = async (jugadorTemporadaId: string, nombre: string) => {
    try {
      await crearSolicitudEdicion({
        tipo: 'jugador-temporada-eliminar',
        datosPropuestos: { jugadorTemporadaId },
      });
      setBajaSolicitada((prev) => new Set(prev).add(jugadorTemporadaId));
      addToast({
        type: 'success',
        title: 'Solicitud de baja enviada',
        message: `Se pidió quitar a ${nombre} de la temporada — requiere doble confirmación de un admin.`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

  const equipoId = useMemo(() => {
    const eq = participacion?.equipo as any;
    if (!eq) return '';
    if (typeof eq === 'string') return eq;
    return eq._id || '';
  }, [participacion?.equipo]);

  useEffect(() => {
    const run = async () => {
      if (!participacion?._id) return;
      setLoading(true);
      try {
        const list = await listJugadorTemporadaByParticipacion(participacion._id);
        setItems(list);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [participacion?._id]);

  useEffect(() => {
    const run = async () => {
      if (!isOpen || !equipoId || !participacion?._id) return;
      setOpcionesLoading(true);
      try {
        const opts = await opcionesJugadorTemporada(equipoId, participacion._id);
        setOpciones(opts);
      } finally {
        setOpcionesLoading(false);
      }
    };
    void run();
  }, [isOpen, equipoId, participacion?._id]);

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Jugadores de la temporada"
      size="lg"
      message={
        <div className="space-y-6">
          <div className="space-y-3">
            <SectionHeader icon={<UserGroupIcon className="h-4 w-4" />} count={items.length}>
              Plantel
            </SectionHeader>
            {loading ? (
              <p className="animate-pulse py-4 text-center text-xs text-slate-400">Cargando…</p>
            ) : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {items.map((it) => {
                  const nombre = typeof it.jugadorEquipo === 'string'
                    ? it.jugadorEquipo
                    : (it.jugadorEquipo?.jugador?.nombre || it.jugadorEquipo?.jugador?.alias || 'Jugador sin nombre');
                  return (
                    <li key={it._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar nombre={nombre} />
                        <span className="truncate text-sm font-medium text-slate-800">{nombre}</span>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2 pl-11 sm:pl-0">
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={it.estado}
                          onChange={async (e) => {
                            const nuevo = e.target.value as any;
                            await updateJugadorTemporada(it._id, { estado: nuevo });
                            setItems((prev) => prev.map(x => x._id === it._id ? { ...x, estado: nuevo } : x));
                          }}
                        >
                          {Object.entries(estadoLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={it.rol}
                          onChange={async (e) => {
                            const nuevo = e.target.value as any;
                            await updateJugadorTemporada(it._id, { rol: nuevo });
                            setItems((prev) => prev.map(x => x._id === it._id ? { ...x, rol: nuevo } : x));
                          }}
                        >
                          {Object.entries(rolLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title={bajaSolicitada.has(it._id) ? 'Solicitud de baja ya enviada' : 'Solicitar eliminación de la temporada (requiere doble confirmación)'}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          onClick={() => handleSolicitarBaja(it._id, nombre)}
                          disabled={bajaSolicitada.has(it._id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                    <p className="text-xs font-medium text-slate-400">Sin jugadores en esta temporada</p>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <SectionHeader icon={<UserPlusIcon className="h-4 w-4" />} count={seleccionados.size || undefined}>
              Solicitar jugadores
            </SectionHeader>

            <div className="mt-3">
              {opcionesLoading ? (
                <p className="animate-pulse py-3 text-center text-xs text-slate-400">Cargando opciones…</p>
              ) : opciones.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-400">No hay jugadores disponibles</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-slate-100 bg-white p-1.5">
                  {opciones.map((opt) => {
                    const nombre = opt.jugador?.nombre || opt.jugador?.alias || 'Jugador sin nombre';
                    const isSelected = seleccionados.has(opt._id);
                    return (
                      <label
                        key={opt._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSeleccionados = new Set(seleccionados);
                            if (e.target.checked) newSeleccionados.add(opt._id);
                            else newSeleccionados.delete(opt._id);
                            setSeleccionados(newSeleccionados);
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <Avatar nombre={nombre} />
                        <span className={`truncate text-sm ${isSelected ? 'font-semibold text-brand-800' : 'text-slate-700'}`}>
                          {nombre}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                {Object.entries(estadoLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" value={rol} onChange={(e) => setRol(e.target.value as any)}>
                {Object.entries(rolLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                onClick={async () => {
                  if (!participacion?._id || seleccionados.size === 0) return;

                  const solicitudes = Array.from(seleccionados).map(jugadorEquipoId =>
                    crearSolicitudEdicion({
                      tipo: 'jugador-temporada-crear',
                      datosPropuestos: {
                        jugadorEquipoId,
                        participacionTemporadaId: participacion._id,
                        estado,
                        rol
                      }
                    })
                  );

                  await Promise.all(solicitudes);
                  addToast({
                    type: 'success',
                    title: `${seleccionados.size} solicitud${seleccionados.size > 1 ? 'es' : ''} enviada${seleccionados.size > 1 ? 's' : ''} a administradores`
                  });
                  setSeleccionados(new Set());
                }}
                disabled={seleccionados.size === 0}
              >
                Solicitar ({seleccionados.size})
              </button>
            </div>
          </div>
        </div> as any
      }
      confirmLabel="Cerrar"
      showCancel={false}
      variant="primary"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
}
