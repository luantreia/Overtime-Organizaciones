import React from 'react';
import type { Partido } from '../../../types';

interface VisualBracketProps {
  matches: Partido[];
  onMatchClick?: (matchId: string) => void;
}

const STAGE_ORDER = ['octavos', 'cuartos', 'semifinal', 'final'];
const STAGE_LABELS: Record<string, string> = {
  octavos: 'Octavos',
  cuartos: 'Cuartos',
  semifinal: 'Semis',
  final: 'Final',
};

export const VisualBracket: React.FC<VisualBracketProps> = ({ matches, onMatchClick }) => {
  const matchesByStage = matches.reduce((acc, match) => {
    const stage = match.etapa?.toLowerCase() || 'otro';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(match);
    return acc;
  }, {} as Record<string, Partido[]>);

  const activeStages = STAGE_ORDER.filter(s => matchesByStage[s]?.length > 0);

  if (activeStages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <span className="text-4xl mb-2">🌳</span>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">El cuadro se armará según definas las etapas</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
      <div className="flex min-w-max gap-8 px-4 items-stretch">
        {activeStages.map((stage, sIdx) => (
          <div key={stage} className="flex flex-col gap-6 w-64">
            <div className="text-center py-2 px-4 bg-slate-900 rounded-xl shadow-sm border border-slate-700">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {STAGE_LABELS[stage]}
              </span>
            </div>
            
            <div className="flex flex-col justify-around flex-1 gap-4">
              {matchesByStage[stage].map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => onMatchClick?.(m.id)}
                  className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm p-3 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${m.estado === 'finalizado' ? 'bg-green-500' : m.estado === 'en_juego' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center justify-between gap-3 p-1.5 rounded-lg transition-colors ${(m.marcadorLocal ?? 0) > (m.marcadorVisitante ?? 0) && m.estado === 'finalizado' ? 'bg-green-50' : 'bg-slate-50'}`}>
                      <span className={`text-xs truncate flex-1 ${(m.marcadorLocal ?? 0) > (m.marcadorVisitante ?? 0) && m.estado === 'finalizado' ? 'font-black text-green-900' : 'font-bold text-slate-700'}`}>
                        {m.localNombre || 'TBD'}
                      </span>
                      <span className={`text-[11px] font-black tabular-nums ${(m.marcadorLocal ?? 0) > (m.marcadorVisitante ?? 0) && m.estado === 'finalizado' ? 'text-green-600' : 'text-slate-400'}`}>
                        {m.marcadorLocal ?? '-'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between gap-3 p-1.5 rounded-lg transition-colors ${(m.marcadorVisitante ?? 0) > (m.marcadorLocal ?? 0) && m.estado === 'finalizado' ? 'bg-green-50' : 'bg-slate-50'}`}>
                      <span className={`text-xs truncate flex-1 ${(m.marcadorVisitante ?? 0) > (m.marcadorLocal ?? 0) && m.estado === 'finalizado' ? 'font-black text-green-900' : 'font-bold text-slate-700'}`}>
                        {m.visitanteNombre || m.rival || 'TBD'}
                      </span>
                      <span className={`text-[11px] font-black tabular-nums ${(m.marcadorVisitante ?? 0) > (m.marcadorLocal ?? 0) && m.estado === 'finalizado' ? 'text-green-600' : 'text-slate-400'}`}>
                        {m.marcadorVisitante ?? '-'}
                      </span>
                    </div>
                  </div>

                  {/* Connectors logic simplified */}
                  {sIdx < activeStages.length - 1 && (
                    <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-slate-200 group-hover:bg-brand-300 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
