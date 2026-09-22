import React, { useState } from 'react';
import { Overlay } from 'overtime-kit';
import { Button, Input, Select } from '../../../../shared/components/ui';

interface QuickAddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (datos: {
    nombre: string;
    alias?: string;
    genero?: string;
    fechaNacimiento?: string;
  }) => Promise<void>;
}

const FORM_ID = 'quick-add-player-form';

export const QuickAddPlayerModal: React.FC<QuickAddPlayerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [nombre, setNombre] = useState('');
  const [alias, setAlias] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState<'masculino' | 'femenino' | 'otro' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await onSuccess({
        nombre,
        alias,
        genero: genero || undefined,
        fechaNacimiento: fechaNacimiento || undefined
      });
      setNombre('');
      setAlias('');
      setFechaNacimiento('');
      setGenero('');
    } catch (e: any) {
      setError(e.message || 'Error al crear jugador');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Nuevo Jugador Rápido"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={busy}
            disabled={!nombre.trim() || busy}
          >
            Crear y Agregar
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
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

        <Input
          label="Fecha de Nacimiento (Opcional)"
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
        />

        <Select
          label="Género"
          value={genero}
          onChange={(e) => setGenero(e.target.value as any)}
          options={[
            { label: 'Masculino', value: 'masculino' },
            { label: 'Femenino', value: 'femenino' },
            { label: 'Otro', value: 'otro' },
          ]}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Overlay>
  );
};
