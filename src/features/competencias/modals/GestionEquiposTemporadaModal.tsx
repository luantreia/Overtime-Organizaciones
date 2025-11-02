import { useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendParticipacionTemporada } from '../services';
import { obtenerOpcionesEquipos, type EquipoOpcion } from '../../equipo/services/equipoService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  esAdmin: boolean;
  temporadaId: string;
  participaciones: BackendParticipacionTemporada[];
  onUpdateParticipacionTemporada: (id: string, body: Partial<{ estado: string }>) => void | Promise<void>;
  onDeleteParticipacionTemporada: (id: string, temporadaId: string) => void | Promise<void>;
  onCrearSolicitudParticipacionTemporada: (temporadaId: string, equipoId: string) => void | Promise<void>;
  onOpenJugadores: (pt: BackendParticipacionTemporada) => void;
};

export default function GestionEquiposTemporadaModal({ isOpen, onClose, esAdmin, temporadaId, participaciones, onUpdateParticipacionTemporada, onDeleteParticipacionTemporada, onCrearSolicitudParticipacionTemporada, onOpenJugadores }: Props) {
  const [equipoSearch, setEquipoSearch] = useState('');
  const [equipoOptions, setEquipoOptions] = useState<EquipoOpcion[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<{ id: string; nombre: string } | null>(null);

  const buscarEquipos = async (query: string) => {
    setEquipoSearch(query);
    if (!query || query.trim().length < 2) {
      setEquipoOptions([]);
      return;
    }
    const opts = await obtenerOpcionesEquipos(query.trim());
    setEquipoOptions(opts);
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Equipos en temporada"
      message={
        <div className="space-y-3">
          <ul className="divide-y divide-slate-200">
            {participaciones.map((pt) => (
              <li key={pt._id} className="py-2 text-sm flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {typeof pt.equipo === 'string' ? pt.equipo : (pt.equipo?.nombre ?? pt._id)}
                </div>
                <div className="flex items-center gap-2">
                  <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" defaultValue={(pt as any).estado || 'activo'} onChange={(e)=>{ void onUpdateParticipacionTemporada(pt._id, { estado: e.target.value }); }} disabled={!esAdmin}>
                    <option value="activo">activo</option>
                    <option value="baja">baja</option>
                    <option value="expulsado">expulsado</option>
                  </select>
                  <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={()=> onOpenJugadores(pt)} disabled={!esAdmin}>Jugadores</button>
                  <button type="button" className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50" onClick={()=>{ void onDeleteParticipacionTemporada(pt._id, temporadaId); }} disabled={!esAdmin}>Eliminar</button>
                </div>
              </li>
            ))}
            {participaciones.length === 0 ? (
              <li className="py-2 text-xs text-slate-500">Sin inscriptos</li>
            ) : null}
          </ul>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h4 className="text-sm font-medium text-slate-800">Solicitar participación</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar equipo por nombre"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={equipoSearch}
                  onChange={(e) => { void buscarEquipos(e.target.value); }}
                  disabled={!esAdmin}
                />
                {equipoOptions.length > 0 ? (
                  <div className="mt-1 max-h-40 overflow-auto rounded-md border border-slate-200 bg-white">
                    {equipoOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                        onClick={() => {
                          setEquipoSeleccionado({ id: opt.id, nombre: opt.nombre });
                          setEquipoSearch(opt.nombre);
                          setEquipoOptions([]);
                        }}
                      >
                        {opt.nombre}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  disabled={!esAdmin || !equipoSeleccionado?.id}
                  onClick={() => {
                    if (!equipoSeleccionado) return;
                    void onCrearSolicitudParticipacionTemporada(temporadaId, equipoSeleccionado.id);
                    setEquipoSeleccionado(null);
                    setEquipoSearch('');
                  }}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  Solicitar participación
                </button>
              </div>
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
