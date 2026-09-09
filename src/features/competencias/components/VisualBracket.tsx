import React from 'react';
import type { Partido } from '../../../types';
import { derivarRondas, extraerTercerPuesto, etapasSecuencialesAMostrar, ETAPA_LABELS, type EtapaConocida } from './derivarRondas';

interface VisualBracketProps {
  matches: Partido[];
  onMatchClick?: (matchId: string) => void;
  onAutoCreate?: (stage: string) => void;
}

/** Una línea de equipo dentro de un cruce: nombre + marcador, resaltada si ganó, con corona. */
const LineaEquipo: React.FC<{ nombre: string; marcador: number | undefined; gano: boolean }> = ({ nombre, marcador, gano }) => (
  <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12px] ${gano ? 'bg-emerald-50 font-bold text-slate-900' : 'text-slate-600'}`}>
    <span className="flex min-w-0 items-center gap-1.5">
      {gano && <span className="text-[11px]" aria-hidden>👑</span>}
      <span className="truncate">{nombre}</span>
    </span>
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[11.5px] font-extrabold [font-variant-numeric:tabular-nums] ${
        gano ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {marcador ?? '–'}
    </span>
  </div>
);

export const VisualBracket: React.FC<VisualBracketProps> = ({ matches, onMatchClick, onAutoCreate }) => {
  const rondas = derivarRondas(matches);
  const tercerPuesto = extraerTercerPuesto(matches);

  const etapasConDatos = new Set(rondas.map((r) => r.etapa));
  const secuenciales = etapasSecuencialesAMostrar(etapasConDatos);

  // Combina las rondas con partidos reales (en su orden derivado, que puede incluir repechaje
  // u otras etapas fuera de la secuencia estándar) con los placeholders de las etapas
  // siguientes que todavía no tienen partidos, para que el organizador pueda crearlos.
  type Columna = { etapa: string; label: string; matches: Partido[] };
  const columnas: Columna[] = [];
  const yaIncluidas = new Set<string>();

  for (const ronda of rondas) {
    columnas.push({ etapa: ronda.etapa, label: ronda.label, matches: ronda.partidos });
    yaIncluidas.add(ronda.etapa);
  }
  for (const etapa of secuenciales as EtapaConocida[]) {
    if (yaIncluidas.has(etapa)) continue;
    columnas.push({ etapa, label: ETAPA_LABELS[etapa], matches: [] });
  }
  // Las columnas con placeholder tienen que quedar después de las que ya tienen partidos, en
  // el orden secuencial real (no alfabético): reordenamos sólo esa cola.
  columnas.sort((a, b) => {
    const aVacia = a.matches.length === 0;
    const bVacia = b.matches.length === 0;
    if (aVacia !== bVacia) return aVacia ? 1 : -1;
    if (aVacia && bVacia) {
      const ia = secuenciales.indexOf(a.etapa as EtapaConocida);
      const ib = secuenciales.indexOf(b.etapa as EtapaConocida);
      return ia - ib;
    }
    return 0; // las que ya tienen partidos mantienen el orden que ya trae `rondas`
  });

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl mb-4 text-slate-400">🏆</div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">
          Dibuja la competencia<br/>
          <span className="text-[10px] font-bold lowercase opacity-70">Arrastra equipos para crear los primeros partidos</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {columnas.map((columna) => (
          <div key={columna.etapa} className="flex min-w-[184px] flex-1 flex-col">
            <h5 className="mb-3 rounded-md bg-slate-100 py-1.5 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500">
              {columna.label}
            </h5>

            <div className="flex flex-1 flex-col justify-around gap-3">
              {columna.matches.length > 0 ? columna.matches.map((m) => {
                const localGana = m.estado === 'finalizado' && (m.marcadorLocal ?? 0) > (m.marcadorVisitante ?? 0);
                const visitaGana = m.estado === 'finalizado' && (m.marcadorVisitante ?? 0) > (m.marcadorLocal ?? 0);

                return (
                  <div
                    key={m.id}
                    onClick={() => onMatchClick?.(m.id)}
                    className={`relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all cursor-pointer
                      ${m.estado === 'en_juego'
                        ? 'border-red-400 shadow-red-100'
                        : 'border-slate-200 hover:border-brand-400 hover:shadow-md'}`}
                  >
                    {(m.estado === 'en_juego' || m.estado === 'finalizado') && (
                      <div className="absolute right-0 top-0 z-10">
                        {m.estado === 'en_juego' && (
                          <span className="rounded-bl-md bg-red-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white animate-pulse">En Vivo</span>
                        )}
                        {m.estado === 'finalizado' && (
                          <span className="rounded-bl-md bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white">Final</span>
                        )}
                      </div>
                    )}
                    <div className="divide-y divide-slate-100">
                      <LineaEquipo nombre={m.localNombre || (m.visitanteNombre ? 'BYE' : 'TBD')} marcador={m.marcadorLocal} gano={localGana} />
                      <LineaEquipo nombre={m.visitanteNombre || (m.localNombre ? 'BYE' : 'TBD')} marcador={m.marcadorVisitante} gano={visitaGana} />
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-2.5 py-1">
                      <span className="text-[8px] font-black uppercase italic text-slate-300">ID: {m.id.slice(-4)}</span>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(m.fecha).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              }) : onAutoCreate ? (
                <button
                  onClick={() => onAutoCreate(columna.etapa)}
                  className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 opacity-60 transition-all hover:border-brand-400 hover:bg-white hover:opacity-100"
                >
                  <span className="text-[10px] font-black uppercase text-slate-400 transition-colors group-hover:text-brand-600">+ Crear {columna.label}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-100 bg-slate-50/30 p-5 opacity-40">
                  <span className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                     {columna.label}<br/>
                     <span className="text-[8px] italic font-bold lowercase opacity-70">Pendiente de resultados</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* El tercer puesto va aparte: es un partido en paralelo a la final, no la ronda que
            sigue después. Antes esta pantalla no lo mostraba en absoluto. */}
        {tercerPuesto && (
          <div className="flex min-w-[184px] flex-1 flex-col">
            <h5 className="mb-3 rounded-md bg-amber-100 py-1.5 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-amber-700">
              3er Puesto
            </h5>
            <div className="flex flex-1 flex-col justify-around gap-3">
              <div
                onClick={() => onMatchClick?.(tercerPuesto.id)}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all cursor-pointer hover:border-amber-400 hover:shadow-md"
              >
                <div className="divide-y divide-slate-100">
                  <LineaEquipo
                    nombre={tercerPuesto.localNombre || 'TBD'}
                    marcador={tercerPuesto.marcadorLocal}
                    gano={tercerPuesto.estado === 'finalizado' && (tercerPuesto.marcadorLocal ?? 0) > (tercerPuesto.marcadorVisitante ?? 0)}
                  />
                  <LineaEquipo
                    nombre={tercerPuesto.visitanteNombre || 'TBD'}
                    marcador={tercerPuesto.marcadorVisitante}
                    gano={tercerPuesto.estado === 'finalizado' && (tercerPuesto.marcadorVisitante ?? 0) > (tercerPuesto.marcadorLocal ?? 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
