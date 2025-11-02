import { useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { nombre: string; fechaInicio: string; fechaFin?: string }) => void | Promise<void>;
};

export default function CrearTemporadaModal({ isOpen, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Crear temporada"
      message={
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
            </div>
          </div>
        </div> as any
      }
      confirmLabel={saving ? 'Creando…' : 'Crear'}
      variant="primary"
      onConfirm={async () => {
        if (!nombre || !fechaInicio) return;
        setSaving(true);
        try {
          await onSubmit({ nombre, fechaInicio, fechaFin: fechaFin || undefined });
          onClose();
        } finally {
          setSaving(false);
        }
      }}
      onCancel={onClose}
    />
  );
}
