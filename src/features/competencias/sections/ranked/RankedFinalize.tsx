import React from 'react';
import { Button, Card } from '../../../../shared/components/ui';

interface RankedFinalizeProps {
  score: { local: number; visitante: number };
  setScore: (s: { local: number; visitante: number }) => void;
  onFinalize: () => void;
  busy: boolean;
  matchActive: boolean;
  board: any[];
}

export const RankedFinalize: React.FC<RankedFinalizeProps> = ({
  score,
  setScore,
  onFinalize,
  busy,
  matchActive,
  board
}) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 border-emerald-100 bg-emerald-50/20">
        <h2 className="mb-3 text-sm font-bold text-emerald-800">Finalizar Match</h2>
        <div className="flex items-center gap-4 justify-center">
          <div className="text-center">
            <span className="block text-[10px] text-red-600 font-bold mb-1">ROJO</span>
            <input 
              type="number" 
              value={score.local} 
              onChange={(e) => setScore({ ...score, local: +e.target.value })} 
              className="w-16 h-12 text-2xl font-bold text-center rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <span className="text-2xl font-bold text-slate-400 mt-4">-</span>
          <div className="text-center">
            <span className="block text-[10px] text-blue-600 font-bold mb-1">AZUL</span>
            <input 
              type="number" 
              value={score.visitante} 
              onChange={(e) => setScore({ ...score, visitante: +e.target.value })} 
              className="w-16 h-12 text-2xl font-bold text-center rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
        </div>
        <Button 
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onFinalize} 
          disabled={busy || !matchActive}
        >
          Aplicar y Subir Puntos
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
