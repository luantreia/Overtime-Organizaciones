import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendParticipacionTemporada } from '../services';
import { listJugadorTemporadaByParticipacion, createJugadorTemporada, updateJugadorTemporada, deleteJugadorTemporada, type BackendJugadorTemporada, opcionesJugadorTemporada, type JugadorEquipoOpcion } from '../services/jugadorTemporadaService';

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
  const [search, setSearch] = useState('');
  const [opciones, setOpciones] = useState<JugadorEquipoOpcion[]>([]);
  const [seleccion, setSeleccion] = useState<JugadorEquipoOpcion | null>(null);
  const [estado, setEstado] = useState<'aceptado' | 'baja' | 'suspendido'>('aceptado');
  const [rol, setRol] = useState<'jugador' | 'entrenador'>('jugador');

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

  const buscarOpciones = async (q: string) => {
    setSearch(q);
    setSeleccion(null);
    if (!q || q.trim().length < 2 || !equipoId || !participacion?._id) { setOpciones([]); return; }
    const opts = await opcionesJugadorTemporada(equipoId, participacion._id, q.trim());
    setOpciones(opts);
  };

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
              <div className="sm:col-span-2">
                <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Buscar jugador por nombre o alias" value={search} onChange={(e)=>{ void buscarOpciones(e.target.value); }} />
                {opciones.length > 0 ? (
                  <div className="mt-1 max-h-40 overflow-auto rounded-md border border-slate-200 bg-white">
                    {opciones.map(opt => (
                      <button key={opt._id} type="button" className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50" onClick={()=>{ setSeleccion(opt); setSearch(opt.jugador?.nombre || opt.jugador?.alias || ''); setOpciones([]); }}>
                        {opt.jugador?.nombre || opt.jugador?.alias || opt._id}
                      </button>
                    ))}
                  </div>
                ) : null}
                {seleccion ? <p className="mt-1 text-xs text-slate-600">Seleccionado: {seleccion.jugador?.nombre || seleccion.jugador?.alias}</p> : null}
              </div>
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
                if (!participacion?._id || !seleccion?._id) return;
                const nuevo = await createJugadorTemporada({ jugadorEquipo: seleccion._id, participacionTemporada: participacion._id, estado, rol });
                setItems((prev)=> [nuevo, ...prev]);
                setSeleccion(null);
                setSearch('');
              }} disabled={!seleccion?._id}>Agregar</button>
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
