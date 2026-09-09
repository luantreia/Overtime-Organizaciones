import React from 'react';
import type { Partido } from '../../../types';
import { derivarRondas, extraerTercerPuesto, etapasSecuencialesAMostrar, ETAPA_LABELS, type EtapaConocida } from './derivarRondas';

interface VisualBracketProps {
  matches: Partido[];
  onMatchClick?: (matchId: string) => void;
  onAutoCreate?: (stage: string) => void;
}

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
    <div className="w-full overflow-x-auto pb-8 custom-scrollbar pt-4">
      <div className="flex min-w-max gap-12 px-8 items-stretch">
        {columnas.map((columna, sIdx) => (
          <div key={columna.etapa} className="flex flex-col gap-8 w-72">
            <div className="relative">
              <div className="text-center py-2.5 px-4 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                  {columna.label}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-around flex-1 gap-12">
              {columna.matches.length > 0 ? columna.matches.map((m) => {
                const localGana = m.estado === 'finalizado' && (m.marcadorLocal ?? 0) > (m.marcadorVisitante ?? 0);
                const visitaGana = m.estado === 'finalizado' && (m.marcadorVisitante ?? 0) > (m.marcadorLocal ?? 0);

                return (
                  <div key={m.id} className="relative group">
                    <div
                      onClick={() => onMatchClick?.(m.id)}
                      className={`relative z-10 bg-white border-2 rounded-2xl p-3 transition-all cursor-pointer overflow-hidden
                        ${m.estado === 'en_juego'
                          ? 'border-red-500 shadow-lg shadow-red-100'
                          : 'border-slate-200 hover:border-brand-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-100/20 active:scale-[0.98]'}`}
                    >
                      <div className="absolute top-0 right-0 flex">
                         {m.estado === 'en_juego' && <span className="bg-red-500 text-[8px] text-white font-black px-2 py-0.5 uppercase tracking-tighter animate-pulse rounded-bl-lg">En Vivo</span>}
                         {m.estado === 'finalizado' && <span className="bg-green-500 text-[8px] text-white font-black px-2 py-0.5 uppercase tracking-tighter rounded-bl-lg">Final</span>}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${localGana ? 'bg-green-50' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                             {localGana && <span className="text-xs">👑</span>}
                             <span className={`text-xs truncate transition-all ${localGana ? 'font-black text-green-900' : 'font-bold text-slate-700'}`}>
                               {m.localNombre || (m.visitanteNombre ? 'BYE' : 'TBD')}
                             </span>
                          </div>
                          <span className={`text-[11px] font-black tabular-nums ${localGana ? 'text-green-600' : 'text-slate-400'}`}>
                            {m.marcadorLocal ?? '-'}
                          </span>
                        </div>

                        <div className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${visitaGana ? 'bg-green-50' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                             {visitaGana && <span className="text-xs">👑</span>}
                             <span className={`text-xs truncate transition-all ${visitaGana ? 'font-black text-green-900' : 'font-bold text-slate-700'}`}>
                               {m.visitanteNombre || (m.localNombre ? 'BYE' : 'TBD')}
                             </span>
                          </div>
                          <span className={`text-[11px] font-black tabular-nums ${visitaGana ? 'text-green-600' : 'text-slate-400'}`}>
                            {m.marcadorVisitante ?? '-'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center px-1">
                         <span className="text-[8px] font-black text-slate-300 uppercase italic">ID: {m.id.slice(-4)}</span>
                         <span className="text-[9px] font-bold text-slate-500">{new Date(m.fecha).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {sIdx < columnas.length - 1 && (
                      <div className={`absolute top-1/2 -right-12 w-12 h-[2px] z-0
                        ${(localGana || visitaGana) ? 'bg-green-400' : 'bg-slate-200'}`}
                      />
                    )}
                  </div>
                );
              }) : onAutoCreate ? (
                <button
                  onClick={() => onAutoCreate(columna.etapa)}
                  className="group bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center opacity-60 hover:opacity-100 hover:border-brand-400 hover:bg-white transition-all cursor-pointer"
                >
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-600 uppercase transition-colors">+ Crear {columna.label}</span>
                  {sIdx > 0 && (
                    <div className="mt-2 text-[9px] font-bold text-slate-300 italic text-center">
                      Ganadores de<br/>{columnas[sIdx - 1]?.label}
                    </div>
                  )}
                </button>
              ) : (
                <div className="bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center opacity-40">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
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
          <div className="flex flex-col gap-8 w-72">
            <div className="text-center py-2.5 px-4 bg-white border-2 border-amber-500 rounded-xl shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">3er Puesto</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-12">
              <div
                onClick={() => onMatchClick?.(tercerPuesto.id)}
                className="relative z-10 bg-white border-2 border-slate-200 rounded-2xl p-3 transition-all cursor-pointer hover:border-amber-400 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-bold text-slate-700 truncate">{tercerPuesto.localNombre || 'TBD'}</span>
                    <span className="text-[11px] font-black tabular-nums text-slate-400">{tercerPuesto.marcadorLocal ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-bold text-slate-700 truncate">{tercerPuesto.visitanteNombre || 'TBD'}</span>
                    <span className="text-[11px] font-black tabular-nums text-slate-400">{tercerPuesto.marcadorVisitante ?? '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
