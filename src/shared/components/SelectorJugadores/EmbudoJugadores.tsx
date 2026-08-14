import { ChevronRightIcon } from '@heroicons/react/20/solid';

export type PasoEmbudo = {
  etiqueta: string;
  valor?: number;
  /** Marca el nivel que se está editando en este modal. */
  activo?: boolean;
};

type Props = {
  pasos: PasoEmbudo[];
  className?: string;
};

/**
 * Muestra el embudo Plantel → Lista de buena fe → Habilitados → Convocados con el número de
 * jugadores de cada escalón.
 *
 * El objetivo es que, cuando a un organizador le falta un jugador en la alineación, pueda ver
 * de un vistazo en qué nivel se cayó en vez de tener que abrir modal por modal a adivinar.
 */
export default function EmbudoJugadores({ pasos, className = '' }: Props) {
  if (pasos.length === 0) return null;

  return (
    <div className={`-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 pb-0.5 ${className}`}>
      {pasos.map((paso, i) => (
        <div key={paso.etiqueta} className="flex flex-shrink-0 items-center gap-0.5">
          {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />}
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              paso.activo
                ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {paso.etiqueta}
            {typeof paso.valor === 'number' && (
              <span className={paso.activo ? 'font-black text-brand-800' : 'font-black text-slate-600'}>
                {paso.valor}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
