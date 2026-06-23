import { useState, useMemo } from 'react';
import type { Partido } from '../../../types';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ESTADO_STYLE: Record<string, { chip: string; dot: string; label: string }> = {
  programado:   { chip: 'bg-blue-50 text-blue-800 hover:bg-blue-100',    dot: 'bg-blue-400',    label: 'Programado' },
  en_juego:     { chip: 'bg-amber-50 text-amber-800 hover:bg-amber-100', dot: 'bg-amber-400',   label: 'En juego' },
  finalizado:   { chip: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100', dot: 'bg-emerald-400', label: 'Finalizado' },
  cancelado:    { chip: 'bg-slate-100 text-slate-400',                   dot: 'bg-slate-300',   label: 'Cancelado' },
  proximamente: { chip: 'bg-purple-50 text-purple-800 hover:bg-purple-100', dot: 'bg-purple-400', label: 'Próximamente' },
};

type Props = {
  partidos: Partido[];
  onSeleccionar: (partidoId: string) => void;
};

export default function CalendarioPartidos({ partidos, onSeleccionar }: Props) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const { celdas, partidosPorDia } = useMemo(() => {
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const grid: (number | null)[] = [];
    for (let i = 0; i < primerDia; i++) grid.push(null);
    for (let d = 1; d <= diasEnMes; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    const mesStr = `${anio}-${String(mes + 1).padStart(2, '0')}`;
    const porDia: Record<number, Partido[]> = {};
    for (const p of partidos) {
      if (typeof p.fecha === 'string' && p.fecha.startsWith(mesStr)) {
        const dia = parseInt(p.fecha.slice(8, 10), 10);
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push(p);
      }
    }

    return { celdas: grid, partidosPorDia: porDia };
  }, [anio, mes, partidos]);

  const irPrevMes = () => {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };
  const irSigMes = () => {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };
  const irHoy = () => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Navegación */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-white">
        <button
          type="button"
          onClick={irPrevMes}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <h2 className="flex-1 text-center text-sm font-semibold text-slate-900">
          {MESES[mes]} {anio}
        </h2>
        <button
          type="button"
          onClick={irSigMes}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
          aria-label="Mes siguiente"
        >
          →
        </button>
        <button
          type="button"
          onClick={irHoy}
          className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          Hoy
        </button>
      </div>

      {/* Encabezado de días */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {celdas.map((dia, i) => {
          const esHoy = dia !== null && `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}` === hoyStr;
          const psDia = dia !== null ? (partidosPorDia[dia] || []) : [];
          const MAX_VISIBLE = 3;

          return (
            <div
              key={i}
              className={`min-h-[90px] p-1.5 ${dia === null ? 'bg-slate-50/70' : 'bg-white'}`}
            >
              {dia !== null && (
                <>
                  <span
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none
                      ${esHoy ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
                  >
                    {dia}
                  </span>
                  <div className="space-y-0.5">
                    {psDia.slice(0, MAX_VISIBLE).map(p => {
                      const style = ESTADO_STYLE[p.estado] ?? ESTADO_STYLE.programado;
                      const local = p.equipoLocal?.nombre ?? p.localNombre ?? '?';
                      const visitante = p.equipoVisitante?.nombre ?? p.visitanteNombre ?? '?';
                      const titulo = `${local} vs ${visitante}`;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSeleccionar(p.id)}
                          title={`${titulo}${p.hora ? ' · ' + p.hora : ''}`}
                          className={`flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium transition ${style.chip}`}
                        >
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.dot}`} />
                          <span className="truncate">
                            {p.hora && <span className="mr-0.5 font-normal opacity-60">{p.hora}</span>}
                            {titulo}
                          </span>
                        </button>
                      );
                    })}
                    {psDia.length > MAX_VISIBLE && (
                      <span className="block px-1 text-[10px] text-slate-400">
                        +{psDia.length - MAX_VISIBLE} más
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-2.5">
        {Object.entries(ESTADO_STYLE)
          .filter(([k]) => k !== 'proximamente')
          .map(([k, s]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
      </div>
    </div>
  );
}
