import { useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    nombre: string;
    descripcion?: string;
    tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
    orden?: number;
    fechaInicio?: string;
    fechaFin?: string;
    numeroClasificados?: number;
    faseOrigenA?: string;
    faseOrigenB?: string;
  }) => void | Promise<void>;
};

export default function CrearFaseModal({ isOpen, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro' | ''>('');
  const [orden, setOrden] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [numeroClasificados, setNumeroClasificados] = useState<string>('');
  const [faseOrigenA, setFaseOrigenA] = useState('');
  const [faseOrigenB, setFaseOrigenB] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Crear fase"
      message={
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={tipo} onChange={(e)=>setTipo(e.target.value as any)}>
                <option value="">—</option>
                <option value="grupo">Grupo</option>
                <option value="liga">Liga</option>
                <option value="playoff">Playoff</option>
                <option value="promocion">Promoción</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Orden</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={orden} onChange={(e)=>setOrden(Number(e.target.value))} />
            </div>
            <div />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600"># Clasificados (solo Grupo)</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={numeroClasificados} onChange={(e)=>setNumeroClasificados(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fase Origen A (opcional)</label>
              <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={faseOrigenA} onChange={(e)=>setFaseOrigenA(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fase Origen B (opcional)</label>
              <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={faseOrigenB} onChange={(e)=>setFaseOrigenB(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
            <textarea className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" rows={2} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} />
          </div>
        </div> as any
      }
      confirmLabel={saving ? 'Creando…' : 'Crear'}
      variant="primary"
      onConfirm={async () => {
        if (!nombre) return;
        setSaving(true);
        try {
          await onSubmit({
            nombre,
            descripcion: descripcion || undefined,
            tipo: (tipo || undefined) as any,
            orden,
            fechaInicio: fechaInicio || undefined,
            fechaFin: fechaFin || undefined,
            numeroClasificados: numeroClasificados ? Number(numeroClasificados) : undefined,
            faseOrigenA: faseOrigenA || undefined,
            faseOrigenB: faseOrigenB || undefined,
          });
          onClose();
        } finally {
          setSaving(false);
        }
      }}
      onCancel={onClose}
    />
  );
}
