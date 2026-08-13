import { useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../shared/components/ModalBase/ModalBase';
import type { BackendParticipacionFase } from '../services';
import {
  listByParticipacionFase,
  opcionesJugadorFase,
  crearJugadorFase,
  eliminarJugadorFase,
} from '../services/jugadorFaseService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participacionFase: BackendParticipacionFase | null;
  onSaved?: () => void | Promise<void>;
};

type FilaJugador = {
  jugadorTemporadaId: string;
  nombre: string;
  alias?: string;
  jugadorFaseId: string | null; // no-null = ya estaba habilitado antes de abrir el modal
  checked: boolean;
};

function equipoNombre(pf: BackendParticipacionFase | null): string {
  const pt: any = pf?.participacionTemporada;
  if (!pt || typeof pt === 'string') return 'este equipo';
  const eq = pt.equipo;
  if (typeof eq === 'string') return eq;
  return eq?.nombre || 'este equipo';
}

function participacionTemporadaId(pf: BackendParticipacionFase | null): string | null {
  const pt: any = pf?.participacionTemporada;
  if (!pt) return null;
  return typeof pt === 'string' ? pt : pt._id;
}

export default function GestionJugadoresFaseModal({ isOpen, onClose, participacionFase, onSaved }: Props) {
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState<FilaJugador[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [notice, setNotice] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const ptId = participacionTemporadaId(participacionFase);
  const pfId = participacionFase?._id;

  useEffect(() => {
    if (!isOpen || !ptId || !pfId) return;
    let cancelado = false;
    setCargando(true);
    setNotice('');
    setBusqueda('');

    Promise.all([listByParticipacionFase(pfId), opcionesJugadorFase(ptId)])
      .then(([habilitados, plantelCompleto]) => {
        if (cancelado) return;
        const jugadorFaseIdPorJT = new Map<string, string>();
        for (const h of habilitados) {
          const jtId = typeof h.jugadorTemporada === 'string' ? h.jugadorTemporada : h.jugadorTemporada?._id;
          if (jtId) jugadorFaseIdPorJT.set(jtId, h._id);
        }
        const nuevasFilas: FilaJugador[] = plantelCompleto.map((op) => ({
          jugadorTemporadaId: op._id,
          nombre: op.jugador?.nombre || 'Jugador',
          alias: op.jugador?.alias,
          jugadorFaseId: jugadorFaseIdPorJT.get(op._id) || null,
          checked: jugadorFaseIdPorJT.has(op._id),
        }));
        nuevasFilas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        setFilas(nuevasFilas);
      })
      .catch(() => {
        if (!cancelado) setNotice('❌ No pudimos cargar el plantel de la temporada');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen, ptId, pfId]);

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((f) => f.nombre.toLowerCase().includes(q) || f.alias?.toLowerCase().includes(q));
  }, [filas, busqueda]);

  const cantidadHabilitados = useMemo(() => filas.filter((f) => f.checked).length, [filas]);

  const toggle = (jugadorTemporadaId: string) => {
    setFilas((prev) =>
      prev.map((f) => (f.jugadorTemporadaId === jugadorTemporadaId ? { ...f, checked: !f.checked } : f))
    );
  };

  const marcarTodos = (valor: boolean) => {
    setFilas((prev) => prev.map((f) => ({ ...f, checked: valor })));
  };

  const handleGuardar = async () => {
    if (!pfId) return;
    setGuardando(true);
    setNotice('');

    const aAgregar = filas.filter((f) => f.checked && !f.jugadorFaseId);
    const aQuitar = filas.filter((f) => !f.checked && f.jugadorFaseId);

    const resultados = await Promise.allSettled([
      ...aAgregar.map((f) => crearJugadorFase({ jugadorTemporada: f.jugadorTemporadaId, participacionFase: pfId })),
      ...aQuitar.map((f) => eliminarJugadorFase(f.jugadorFaseId as string)),
    ]);

    const errores = resultados.filter((r) => r.status === 'rejected').length;
    setGuardando(false);

    if (errores > 0) {
      setNotice(`⚠️ Se guardó con ${errores} error${errores === 1 ? '' : 'es'} — revisá e intentá de nuevo.`);
    } else {
      setNotice('✅ Plantel de la fase actualizado');
      await onSaved?.();
      setTimeout(() => onClose(), 700);
    }
  };

  if (!isOpen || !participacionFase) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Jugadores de la fase" subtitle={equipoNombre(participacionFase)} size="md">
      <div className="p-1">
        {notice && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{notice}</div>
        )}

        {cargando ? (
          <p className="py-8 text-center text-sm text-slate-400">Cargando plantel de la temporada…</p>
        ) : filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Este equipo todavía no tiene jugadores cargados en la temporada.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Buscar jugador…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                {cantidadHabilitados}/{filas.length} habilitados
              </span>
            </div>

            <div className="mb-2 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => marcarTodos(true)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => marcarTodos(false)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Desmarcar todos
              </button>
            </div>

            <ul className="max-h-[45vh] space-y-1 overflow-y-auto pr-1">
              {filasFiltradas.map((f) => (
                <li key={f.jugadorTemporadaId}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={f.checked}
                      onChange={() => toggle(f.jugadorTemporadaId)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-800">{f.nombre}</span>
                    {f.alias && <span className="text-xs text-slate-400">({f.alias})</span>}
                  </label>
                </li>
              ))}
              {filasFiltradas.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-400">Sin resultados para "{busqueda}"</li>
              )}
            </ul>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando || cargando || filas.length === 0}
            onClick={() => void handleGuardar()}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
