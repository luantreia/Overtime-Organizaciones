import React, { useEffect, useState } from 'react';
import { getSolicitudes } from '../services/solicitudesEdicionService';
import type { SolicitudEdicion } from '../../../types/solicitudesEdicion';
import SolicitudEditModal from '../components/SolicitudEditModalSimple';

export default function NotificacionesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudEdicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSolicitud, setOpenSolicitud] = useState<SolicitudEdicion | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSolicitudes();
      setSolicitudes(data);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void cargar(); }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Notificaciones</h1>
      {loading ? <p>Cargando…</p> : error ? <p className="text-rose-600">{error}</p> : (
        <div className="mt-4 space-y-2">
          {solicitudes.map((s) => (
            <div key={s._id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.tipo}</div>
                  <div className="text-xs text-slate-600">Estado: {s.estado}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOpenSolicitud(s)} className="rounded border px-2 py-1 text-sm">Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {openSolicitud ? (
        <SolicitudEditModal solicitud={openSolicitud} onClose={() => setOpenSolicitud(null)} onSaved={(u) => { setSolicitudes((p) => p.map((x) => x._id === u._id ? u : x)); setOpenSolicitud(null); }} />
      ) : null}
    </div>
  );
}
