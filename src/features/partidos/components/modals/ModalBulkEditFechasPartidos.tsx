import { useMemo, useState } from 'react';
import ModalBase from '../../../../shared/components/ModalBase/ModalBase';
import type { Partido } from '../../../../types';
import { actualizarPartido } from '../../services/partidoService';

interface ModalBulkEditFechasPartidosProps {
  isOpen: boolean;
  partidos: Partido[];
  onClose: () => void;
  onUpdated: () => void;
}

const ESTADOS: Array<{ value: Partido['estado']; label: string }> = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_juego', label: 'En juego' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ModalBulkEditFechasPartidos = ({ isOpen, partidos, onClose, onUpdated }: ModalBulkEditFechasPartidosProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [etapa, setEtapa] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [marcadorLocal, setMarcadorLocal] = useState<string>('');
  const [marcadorVisitante, setMarcadorVisitante] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availablePartidos = useMemo(() => partidos, [partidos]);

  const togglePartido = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(availablePartidos.map((p) => p.id));
  const clearSelection = () => setSelectedIds([]);

  const handleSubmit = async () => {
    if (!selectedIds.length) {
      setError('Seleccioná al menos un partido.');
      return;
    }
    setError('');
    setSaving(true);

    const payload: Record<string, unknown> = {};
    if (etapa.trim()) payload.etapa = etapa.trim();
    if (fecha) payload.fecha = fecha;
    if (hora) payload.hora = hora;
    if (ubicacion.trim()) payload.ubicacion = ubicacion.trim();
    if (estado) payload.estado = estado;
    if (marcadorLocal !== '') payload.marcadorLocal = Number(marcadorLocal);
    if (marcadorVisitante !== '') payload.marcadorVisitante = Number(marcadorVisitante);
    if (marcadorLocal !== '' || marcadorVisitante !== '') payload.marcadorModificadoManualmente = true;

    try {
      await Promise.all(
        selectedIds.map((id) => actualizarPartido(id, payload))
      );
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Revisá los datos e intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Edición rápida de fecha"
      subtitle="Seleccioná partidos y aplica cambios comunes de fecha, hora, ubicación y resultado"
      size="xl"
      bodyClassName="space-y-6 p-6"
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Partidos disponibles</h3>
              <p className="text-xs text-slate-500">Seleccioná los partidos que quieras actualizar juntos.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
            {availablePartidos.length === 0 ? (
              <p className="text-sm text-slate-500">No hay partidos para esta selección.</p>
            ) : (
              <div className="space-y-2">
                {availablePartidos.map((partido) => (
                  <label
                    key={partido.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-brand-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(partido.id)}
                      onChange={() => togglePartido(partido.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                        <span>{partido.rival}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-400">{partido.estado}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {partido.fecha} {partido.hora ? `· ${partido.hora}` : ''} {partido.escenario ? `· ${partido.escenario}` : ''}
                      </p>
                      {partido.etapa ? <p className="text-xs text-slate-400">{partido.etapa}</p> : null}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Nombre de fecha
              <input
                type="text"
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                placeholder="Fecha 1"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Ubicación / cancha
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Cancha Central"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              Día
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Hora
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Estado
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">No cambiar</option>
                {ESTADOS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Marcador local
              <input
                type="number"
                min="0"
                value={marcadorLocal}
                onChange={(e) => setMarcadorLocal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Marcador visitante
              <input
                type="number"
                min="0"
                value={marcadorVisitante}
                onChange={(e) => setMarcadorVisitante(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {selectedIds.length} partido(s) seleccionado(s)
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Aplicar cambios'}
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalBulkEditFechasPartidos;
