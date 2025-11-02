import { useEffect, useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendParticipacionTemporada } from '../services';
import { listJugadorTemporadaByParticipacion, createJugadorTemporada, updateJugadorTemporada, deleteJugadorTemporada, type BackendJugadorTemporada } from '../services/jugadorTemporadaService';

// NOTE: Para crear jugador-temporada necesitamos un jugadorEquipoId. Este modal asume que ya existe esa relación
// y recibe un campo de texto para pegar/ingresar el jugadorEquipoId. Se puede mejorar con un selector luego.

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participacion?: BackendParticipacionTemporada;
};

export default function JugadoresTemporadaModal({ isOpen, onClose, participacion }: Props) {
  const [items, setItems] = useState<BackendJugadorTemporada[]>([]);
  const [loading, setLoading] = useState(false);
  const [jugadorEquipoId, setJugadorEquipoId] = useState('');
  const [estado, setEstado] = useState<'aceptado' | 'baja' | 'suspendido'>('aceptado');
  const [rol, setRol] = useState<'jugador' | 'entrenador'>('jugador');

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
                    <p className="truncate font-medium text-slate-800">{it.jugadorEquipo}</p>
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
            <h4 className="text-sm font-medium text-slate-800">Agregar jugador</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <input className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="jugadorEquipoId" value={jugadorEquipoId} onChange={(e)=>setJugadorEquipoId(e.target.value)} />
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={estado} onChange={(e)=>setEstado(e.target.value as any)}>
                <option value="aceptado">aceptado</option>
                <option value="baja">baja</option>
                <option value="suspendido">suspendido</option>
              </select>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={rol} onChange={(e)=>setRol(e.target.value as any)}>
                <option value="jugador">jugador</option>
                <option value="entrenador">entrenador</option>
              </select>
              <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50" onClick={async ()=>{
                if (!participacion?._id || !jugadorEquipoId) return;
                const nuevo = await createJugadorTemporada({ jugadorEquipo: jugadorEquipoId, participacionTemporada: participacion._id, estado, rol });
                setItems((prev)=> [nuevo, ...prev]);
                setJugadorEquipoId('');
              }}>Agregar</button>
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
