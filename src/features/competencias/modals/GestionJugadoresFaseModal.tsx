import { useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../shared/components/ModalBase/ModalBase';
import { SelectorJugadores, EmbudoJugadores, type FilaSelector } from '../../../shared/components/SelectorJugadores';
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
  jugadorId: string;
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
        const nuevasFilas: FilaJugador[] = plantelCompleto
          .filter((op) => op.jugador?._id)
          .map((op) => ({
            jugadorTemporadaId: op._id,
            jugadorId: op.jugador!._id,
            nombre: op.jugador?.nombre || 'Jugador',
            alias: op.jugador?.alias,
            jugadorFaseId: jugadorFaseIdPorJT.get(op._id) || null,
            checked: jugadorFaseIdPorJT.has(op._id),
          }));
        nuevasFilas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        setFilas(nuevasFilas);
      })
      .catch(() => {
        if (!cancelado) setNotice('❌ No pudimos cargar la lista de buena fe de la temporada');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen, ptId, pfId]);

  const filasSelector: FilaSelector[] = useMemo(
    () =>
      filas.map((f) => ({
        id: f.jugadorTemporadaId,
        nombre: f.nombre,
        alias: f.alias,
        checked: f.checked,
      })),
    [filas]
  );

  const cantidadHabilitados = useMemo(() => filas.filter((f) => f.checked).length, [filas]);
  const hayCambios = useMemo(
    () => filas.some((f) => f.checked !== !!f.jugadorFaseId),
    [filas]
  );

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
      ...aAgregar.map((f) =>
        crearJugadorFase({ jugadorTemporada: f.jugadorTemporadaId, participacionFase: pfId, jugador: f.jugadorId })
      ),
      ...aQuitar.map((f) => eliminarJugadorFase(f.jugadorFaseId as string)),
    ]);

    const errores = resultados.filter((r) => r.status === 'rejected').length;
    setGuardando(false);

    if (errores > 0) {
      setNotice(`⚠️ Se guardó con ${errores} error${errores === 1 ? '' : 'es'} — revisá e intentá de nuevo.`);
    } else {
      setNotice('✅ Habilitados de la fase actualizados');
      await onSaved?.();
      setTimeout(() => onClose(), 700);
    }
  };

  if (!isOpen || !participacionFase) return null;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Habilitados de la fase"
      subtitle={equipoNombre(participacionFase)}
      size="md"
      bodyClassName="p-4 sm:p-5"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando || cargando || !hayCambios}
            onClick={() => void handleGuardar()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      }
      footerClassName="px-4 pb-4 sm:px-5"
    >
      <div className="flex min-h-0 flex-col">
        <EmbudoJugadores
          className="mb-3"
          pasos={[
            { etiqueta: 'Lista de buena fe', valor: filas.length },
            { etiqueta: 'Habilitados', valor: cantidadHabilitados, activo: true },
          ]}
        />

        {notice && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {notice}
          </div>
        )}

        <SelectorJugadores
          filas={filasSelector}
          onToggle={toggle}
          onMarcarTodos={marcarTodos}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          cargando={cargando}
          etiquetaContador="habilitados para esta fase"
          vacioMensaje="Este equipo todavía no tiene jugadores en la lista de buena fe de la temporada."
        />
      </div>
    </ModalBase>
  );
}
