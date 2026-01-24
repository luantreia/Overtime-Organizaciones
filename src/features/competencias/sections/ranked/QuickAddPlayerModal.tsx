import React, { useState } from 'react';
import { Button, Input, Select } from '../../../../shared/components/ui';

interface QuickAddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (datos: { nombre: string; alias?: string; genero?: string }) => Promise<void>;
}

export const QuickAddPlayerModal: React.FC<QuickAddPlayerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [nombre, setNombre] = useState('');
  const [alias, setAlias] = useState('');
  const [genero, setGenero] = useState<'Masculino' | 'Femenino' | 'Otro' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await onSuccess({ nombre, alias, genero: genero || undefined });
      setNombre('');
      setAlias('');
      setGenero('');
    } catch (e: any) {
      setError(e.message || 'Error al crear jugador');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Nuevo Jugador Rápido</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
            required
            autoFocus
          />
          
          <Input
            label="Apodo / Alias (Opcional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Ej: El Rayo"
          />

          <Select
            label="Género"
            value={genero}
            onChange={(e) => setGenero(e.target.value as any)}
            options={[
              { label: 'Masculino', value: 'Masculino' },
              { label: 'Femenino', value: 'Femenino' },
              { label: 'Otro', value: 'Otro' },
            ]}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              loading={busy}
              disabled={!nombre.trim() || busy}
            >
              Crear y Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
