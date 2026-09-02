import { useEffect, useMemo, useState } from 'react';
import { TrashIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import ModalBase from '../../../shared/components/ModalBase/ModalBase';
import { SelectorJugadores, EmbudoJugadores, type FilaSelector } from '../../../shared/components/SelectorJugadores';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import type { BackendParticipacionTemporada } from '../services';
import {
  listJugadorTemporadaByParticipacion,
  updateJugadorTemporada,
  type BackendJugadorTemporada,
  opcionesJugadorTemporada,
  type JugadorEquipoOpcion,
} from '../services/jugadorTemporadaService';
import { crearSolicitudEdicion } from '../../../shared/features/solicitudes';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participacion?: BackendParticipacionTemporada;
};

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

const nombreDe = (it: BackendJugadorTemporada) =>
  typeof it.jugadorEquipo === 'string'
    ? it.jugadorEquipo
    : it.jugadorEquipo?.jugador?.nombre || it.jugadorEquipo?.jugador?.alias || 'Jugador sin nombre';

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500';

export default function JugadoresTemporadaModal({ isOpen, onClose, participacion }: Props) {
  const [items, setItems] = useState<BackendJugadorTemporada[]>([]);
  const [loading, setLoading] = useState(false);
  const [opciones, setOpciones] = useState<JugadorEquipoOpcion[]>([]);
  const [opcionesLoading, setOpcionesLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<'aceptado' | 'baja' | 'suspendido'>('aceptado');
  const [rol, setRol] = useState<'jugador' | 'entrenador'>('jugador');
  const [bajaSolicitada, setBajaSolicitada] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const { addToast } = useToast();

  const equipoId = useMemo(() => {
    const eq = participacion?.equipo as any;
    if (!eq) return '';
    if (typeof eq === 'string') return eq;
    return eq._id || '';
  }, [participacion?.equipo]);

  const equipoNombre = useMemo(() => {
    const eq = participacion?.equipo as any;
    if (!eq) return 'este equipo';
    if (typeof eq === 'string') return eq;
    return eq.nombre || 'este equipo';
  }, [participacion?.equipo]);

  useEffect(() => {
    const run = async () => {
      if (!isOpen || !participacion?._id) return;
      setLoading(true);
      try {
        const list = await listJugadorTemporadaByParticipacion(participacion._id);
        setItems(list);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [isOpen, participacion?._id]);

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

  useEffect(() => {
    if (!isOpen) {
      setSeleccionados(new Set());
      setBusqueda('');
    }
  }, [isOpen]);

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
        message: `Se pidió quitar a ${nombre} de la lista de buena fe — requiere doble confirmación de un admin.`,
      });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    }
  };

  const patchItem = (id: string, cambios: Partial<BackendJugadorTemporada>) =>
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, ...cambios } : x)));

  const handleDorsal = async (it: BackendJugadorTemporada, valor: string) => {
    const numero = valor === '' ? null : Number(valor);
    if (numero !== null && (Number.isNaN(numero) || numero < 0 || numero > 99)) return;
    const previo = it.numeroCamiseta;
    patchItem(it._id, { numeroCamiseta: numero ?? undefined });
    try {
      await updateJugadorTemporada(it._id, { numeroCamiseta: numero });
    } catch (error: any) {
      patchItem(it._id, { numeroCamiseta: previo });
      addToast({ type: 'error', title: 'No se pudo guardar el dorsal', message: error.message });
    }
  };

  const filasOpciones: FilaSelector[] = useMemo(
    () =>
      opciones.map((opt) => {
        // `elegible === false` solo llega cuando la competencia es Masculino o Femenino
        // y el género del jugador es el opuesto. Se muestra deshabilitado en vez de
        // ocultarse: si desaparece de la lista, quien la carga no puede distinguir un
        // problema de categoría de uno de contrato o de un alta que falta.
        const noElegible = opt.elegible === false;

        return {
          id: opt._id,
          nombre: opt.jugador?.nombre || opt.jugador?.alias || 'Jugador sin nombre',
          alias: opt.jugador?.alias,
          checked: seleccionados.has(opt._id),
          disabled: noElegible,
          badge: noElegible ? (
            <span className="flex-shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
              Fuera de categoría{opt.categoriaCompetencia ? ` · ${opt.categoriaCompetencia}` : ''}
            </span>
          ) : opt.estado === 'baja' ? (
            <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Baja{opt.hasta ? ` · hasta ${new Date(opt.hasta).toLocaleDateString()}` : ''}
            </span>
          ) : undefined,
        };
      }),
    [opciones, seleccionados]
  );

  const toggleOpcion = (id: string) => {
    if (opciones.find((o) => o._id === id)?.elegible === false) return;
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTodos = (valor: boolean) =>
    setSeleccionados(
      valor
        ? new Set(opciones.filter((o) => o.elegible !== false).map((o) => o._id))
        : new Set()
    );

  const handleSolicitar = async () => {
    if (!participacion?._id || seleccionados.size === 0) return;
    setEnviando(true);
    try {
      await Promise.all(
        Array.from(seleccionados).map((jugadorEquipoId) =>
          crearSolicitudEdicion({
            tipo: 'jugador-temporada-crear',
            datosPropuestos: { jugadorEquipoId, participacionTemporadaId: participacion._id, estado, rol },
          })
        )
      );
      addToast({
        type: 'success',
        title: `${seleccionados.size} solicitud${seleccionados.size > 1 ? 'es' : ''} enviada${seleccionados.size > 1 ? 's' : ''}`,
        message: 'Quedan pendientes de aprobación de un admin.',
      });
      setSeleccionados(new Set());
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message });
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || !participacion) return null;

  const plantelTotal = items.length + opciones.length;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Lista de buena fe"
      subtitle={`${equipoNombre} · jugadores inscriptos en esta temporada`}
      size="lg"
      bodyClassName="p-4 sm:p-5"
      footer={
        <div className="flex items-center justify-end px-4 pb-1 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <EmbudoJugadores
          pasos={[
            { etiqueta: 'Plantel del club', valor: plantelTotal },
            { etiqueta: 'Lista de buena fe', valor: items.length, activo: true },
          ]}
        />

        {/* Inscriptos en la temporada */}
        <div className="space-y-2">
          <SectionHeader icon={<UserGroupIcon className="h-4 w-4" />} count={items.length}>
            En la temporada
          </SectionHeader>
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
              <p className="text-sm text-slate-400">Todavía no hay jugadores en la lista de buena fe</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {items.map((it) => {
                const nombre = nombreDe(it);
                return (
                  <li
                    key={it._id}
                    className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:flex-nowrap"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{nombre}</span>
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <span className="hidden sm:inline">N°</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={99}
                          placeholder="—"
                          defaultValue={it.numeroCamiseta ?? ''}
                          onBlur={(e) => void handleDorsal(it, e.target.value)}
                          className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </label>
                      <select
                        className={selectClass}
                        value={it.estado}
                        onChange={async (e) => {
                          const nuevo = e.target.value as any;
                          await updateJugadorTemporada(it._id, { estado: nuevo });
                          patchItem(it._id, { estado: nuevo });
                        }}
                      >
                        {Object.entries(estadoLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        className={selectClass}
                        value={it.rol}
                        onChange={async (e) => {
                          const nuevo = e.target.value as any;
                          await updateJugadorTemporada(it._id, { rol: nuevo });
                          patchItem(it._id, { rol: nuevo });
                        }}
                      >
                        {Object.entries(rolLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        title={
                          bajaSolicitada.has(it._id)
                            ? 'Solicitud de baja ya enviada'
                            : 'Solicitar baja de la lista de buena fe (requiere doble confirmación)'
                        }
                        className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 sm:ml-0"
                        onClick={() => handleSolicitarBaja(it._id, nombre)}
                        disabled={bajaSolicitada.has(it._id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Sumar desde el plantel del club */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4">
          <SectionHeader icon={<UserPlusIcon className="h-4 w-4" />} count={seleccionados.size || undefined}>
            Sumar del plantel del club
          </SectionHeader>

          <div className="mt-3">
            <SelectorJugadores
              filas={filasOpciones}
              onToggle={toggleOpcion}
              onMarcarTodos={marcarTodos}
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              cargando={opcionesLoading}
              etiquetaContador="a solicitar"
              vacioMensaje="Todo el plantel del club ya está en la lista de buena fe."
            />
          </div>

          {opciones.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <select className={`${selectClass} py-2`} value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                {Object.entries(estadoLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select className={`${selectClass} py-2`} value={rol} onChange={(e) => setRol(e.target.value as any)}>
                {Object.entries(rolLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                onClick={() => void handleSolicitar()}
                disabled={seleccionados.size === 0 || enviando}
              >
                {enviando ? 'Enviando…' : `Solicitar (${seleccionados.size})`}
              </button>
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            Las altas quedan pendientes de aprobación. El dorsal se carga una vez aprobado, desde la lista de arriba.
          </p>
        </div>
      </div>
    </ModalBase>
  );
}
