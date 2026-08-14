import { type ReactNode, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

export type FilaSelector = {
  id: string;
  nombre: string;
  alias?: string;
  checked: boolean;
  disabled?: boolean;
  /** Chip informativo al lado del nombre (ej: "Baja · hasta 12/03"). */
  badge?: ReactNode;
  /** Controles propios del nivel (dorsal, rol). En mobile bajan a una segunda línea. */
  extra?: ReactNode;
};

type Props = {
  filas: FilaSelector[];
  onToggle: (id: string) => void;
  onMarcarTodos?: (valor: boolean) => void;
  busqueda: string;
  onBusquedaChange: (q: string) => void;
  cargando?: boolean;
  /** Sustantivo del nivel: "habilitados", "convocados", "en la lista". */
  etiquetaContador?: string;
  vacioMensaje?: string;
  /** Acción propia del nivel, al lado de Marcar/Desmarcar todos. */
  accionExtra?: ReactNode;
};

/**
 * Lista de jugadores con checkbox, buscador y contador — compartida por los tres niveles
 * (lista de buena fe, habilitados de la fase, convocados del partido) para que la misma
 * tarea se haga siempre con el mismo gesto.
 *
 * No guarda nada por su cuenta: el padre mantiene el estado y decide cuándo persistir.
 */
export default function SelectorJugadores({
  filas,
  onToggle,
  onMarcarTodos,
  busqueda,
  onBusquedaChange,
  cargando = false,
  etiquetaContador = 'seleccionados',
  vacioMensaje = 'No hay jugadores para mostrar.',
  accionExtra,
}: Props) {
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter(
      (f) => f.nombre.toLowerCase().includes(q) || f.alias?.toLowerCase().includes(q)
    );
  }, [filas, busqueda]);

  const marcados = useMemo(() => filas.filter((f) => f.checked).length, [filas]);

  if (cargando) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
        <p className="text-sm text-slate-400">{vacioMensaje}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      {/* Header pegado: buscador y contador siempre visibles aunque la lista sea larga */}
      <div className="sticky top-0 z-10 space-y-2 bg-white pb-2 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              inputMode="search"
              placeholder="Buscar jugador…"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            {marcados}/{filas.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {onMarcarTodos && (
            <>
              <button
                type="button"
                onClick={() => onMarcarTodos(true)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => onMarcarTodos(false)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Desmarcar todos
              </button>
            </>
          )}
          {accionExtra}
          <span className="ml-auto text-slate-400">{etiquetaContador}</span>
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {filtradas.map((f) => (
          <li key={f.id}>
            <label
              className={`flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 py-2 sm:flex-nowrap ${
                f.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={f.checked}
                disabled={f.disabled}
                onChange={() => onToggle(f.id)}
                className="h-5 w-5 flex-shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                {f.nombre}
                {f.alias && <span className="ml-1.5 text-xs text-slate-400">({f.alias})</span>}
              </span>
              {f.badge}
              {/* En mobile ocupa toda la fila siguiente; desde sm queda a la derecha */}
              {f.extra && (
                <div
                  className="w-full pl-8 sm:w-auto sm:flex-shrink-0 sm:pl-0"
                  onClick={(e) => e.preventDefault()}
                >
                  {f.extra}
                </div>
              )}
            </label>
          </li>
        ))}
        {filtradas.length === 0 && (
          <li className="py-8 text-center text-sm text-slate-400">Sin resultados para "{busqueda}"</li>
        )}
      </ul>
    </div>
  );
}
