import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import type { BackendParticipacionTemporada } from '../services';
import { listJugadorTemporadaByParticipacion, updateJugadorTemporada, deleteJugadorTemporada, type BackendJugadorTemporada, opcionesJugadorTemporada, type JugadorEquipoOpcion } from '../services/jugadorTemporadaService';
import { crearSolicitud } from '../../solicitudes/services/solicitudesEdicionService';

// NOTE: Para agregar jugadores a la temporada, se pueden seleccionar múltiples jugadores
// y crear solicitudes que deben ser aprobadas por los administradores

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participacion?: BackendParticipacionTemporada;
};

export default function JugadoresTemporadaModal({ isOpen, onClose, participacion }: Props) {
  const [items, setItems] = useState<BackendJugadorTemporada[]>([]);
  const [loading, setLoading] = useState(false);
  const [opciones, setOpciones] = useState<JugadorEquipoOpcion[]>([]);
  const [opcionesLoading, setOpcionesLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<'aceptado' | 'baja' | 'suspendido'>('aceptado');
  const [rol, setRol] = useState<'jugador' | 'entrenador'>('jugador');
  const { addToast } = useToast();

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
      message={
        <div className="space-y-3">
          {loading ? <p className="text-sm text-slate-500">Cargando…</p> : (
            <ul className="divide-y divide-slate-200">
              {items.map((it) => (
                <li key={it._id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {typeof it.jugadorEquipo === 'string' 
                        ? it.jugadorEquipo 
                        : (it.jugadorEquipo?.jugador?.nombre || it.jugadorEquipo?.jugador?.alias || 'Jugador sin nombre')}
                    </p>
                    <p className="truncate text-xs text-slate-500">Estado: {it.estado} · Rol: {it.rol}</p>
                  </div>
                  <div className="flex gap-2">
                    <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" value={it.estado} onChange={async (e)=>{
                      const nuevo = e.target.value as any;
                      await updateJugadorTemporada(it._id, { estado: nuevo });
                      setItems((prev)=> prev.map(x => x._id===it._id ? { ...x, estado: nuevo } : x));
                    }}>
                      <option value="aceptado">aceptado</option>
                      <option value="baja">baja</option>
                      <option value="suspendido">suspendido</option>
                    </select>
                    <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" value={it.rol} onChange={async (e)=>{
                      const nuevo = e.target.value as any;
                      await updateJugadorTemporada(it._id, { rol: nuevo });
                      setItems((prev)=> prev.map(x => x._id===it._id ? { ...x, rol: nuevo } : x));
                    }}>
                      <option value="jugador">jugador</option>
                      <option value="entrenador">entrenador</option>
                    </select>
                    <button className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100" onClick={async ()=>{
                      await deleteJugadorTemporada(it._id);
                      setItems((prev)=> prev.filter(x => x._id !== it._id));
                    }}>Eliminar</button>
                  </div>
                </li>
              ))}
              {items.length === 0 ? <li className="py-2 text-xs text-slate-500">Sin jugadores</li> : null}
            </ul>
          )}

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h4 className="text-sm font-medium text-slate-800">Solicitar jugadores</h4>
            <div className="mt-2 space-y-2">
              {opcionesLoading ? (
                <p className="text-sm text-slate-500">Cargando opciones...</p>
              ) : opciones.length === 0 ? (
                <p className="text-sm text-slate-500">No hay jugadores disponibles</p>
              ) : (
                <div className="max-h-40 overflow-auto space-y-1">
                  {opciones.map((opt) => (
                    <label key={opt._id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(opt._id)}
                        onChange={(e) => {
                          const newSeleccionados = new Set(seleccionados);
                          if (e.target.checked) {
                            newSeleccionados.add(opt._id);
                          } else {
                            newSeleccionados.delete(opt._id);
                          }
                          setSeleccionados(newSeleccionados);
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="truncate">
                        {opt.jugador?.nombre || opt.jugador?.alias || 'Jugador sin nombre'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={estado} onChange={(e)=>setEstado(e.target.value as any)}>
                <option value="aceptado">aceptado</option>
                <option value="baja">baja</option>
                <option value="suspendido">suspendido</option>
              </select>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={rol} onChange={(e)=>setRol(e.target.value as any)}>
                <option value="jugador">jugador</option>
                <option value="entrenador">entrenador</option>
              </select>
              <button 
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50" 
                onClick={async ()=>{
                  if (!participacion?._id || seleccionados.size === 0) return;
                  
                  const solicitudes = Array.from(seleccionados).map(jugadorEquipoId => 
                    crearSolicitud('jugador-temporada-crear', {
                      jugadorEquipoId,
                      participacionTemporadaId: participacion._id,
                      estado,
                      rol
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
