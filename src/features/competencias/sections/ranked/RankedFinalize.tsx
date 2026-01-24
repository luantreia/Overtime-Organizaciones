import React from 'react';
import { Button, Card } from '../../../../shared/components/ui';
import { MatchTimer } from './MatchTimer';

interface RankedFinalizeProps {
  score: { local: number; visitante: number };
  adjustScore: (team: 'local' | 'visitante', delta: number) => void;
  onFinalize: () => void;
  busy: boolean;
  matchActive: boolean;
  board: any[];
  startTime: number | null;
}

export const RankedFinalize: React.FC<RankedFinalizeProps> = ({
  score,
  adjustScore,
  onFinalize,
  busy,
  matchActive,
  board,
  startTime
}) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 border-emerald-100 bg-emerald-50/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-emerald-800">Marcador en Vivo</h2>
          {matchActive && <MatchTimer startTime={startTime} />}
        </div>
        
        <div className="flex items-center gap-2 justify-center py-4">
          {/* Rojo Team */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-red-600">ROJO</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => adjustScore('local', -1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95"
                disabled={!matchActive}
              >
                -
              </button>
              <div className="w-16 h-16 flex items-center justify-center text-4xl font-black rounded-xl bg-white border shadow-sm text-slate-900">
                {score.local}
              </div>
              <button 
                onClick={() => adjustScore('local', 1)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 active:scale-90 transition-all font-bold text-xl"
                disabled={!matchActive}
              >
                +
              </button>
            </div>
          </div>

          <div className="mx-2 text-2xl font-bold text-slate-300">vs</div>

          {/* Azul Team */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600">AZUL</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => adjustScore('visitante', 1)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-90 transition-all font-bold text-xl"
                disabled={!matchActive}
              >
                +
              </button>
              <div className="w-16 h-16 flex items-center justify-center text-4xl font-black rounded-xl bg-white border shadow-sm text-slate-900">
                {score.visitante}
              </div>
              <button 
                onClick={() => adjustScore('visitante', -1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95"
                disabled={!matchActive}
              >
                -
              </button>
            </div>
          </div>
        </div>

        <Button 
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-bold uppercase tracking-wide shadow-lg shadow-emerald-200"
          onClick={onFinalize} 
          disabled={busy || !matchActive}
        >
          Finalizar Match y Subir Puntos
        </Button>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Leaderboard Especial</h3>
        <div className="max-h-80 overflow-auto rounded border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-bold text-slate-600">Jugador</th>
                <th className="px-2 py-2 font-bold text-slate-600 text-center">MMR</th>
                <th className="px-2 py-2 font-bold text-slate-600 text-center">PJ</th>
                <th className="px-2 py-2 font-bold text-slate-600 text-center">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {board.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400 italic">No hay datos en el ranking</td>
                </tr>
              ) : (
                board.map((r, idx) => (
                  <tr key={r.playerId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{r.nombre || `ID: ${r.playerId.slice(-4)}`}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">
                        {Math.round(r.rating)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-slate-500">{r.matchesPlayed}</td>
                    <td className="px-2 py-2 text-center">
                      {r.lastDelta ? (
                        <span className={`font-bold ${r.lastDelta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {r.lastDelta > 0 ? `+${r.lastDelta}` : r.lastDelta}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
