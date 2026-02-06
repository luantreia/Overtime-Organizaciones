import React, { useState } from 'react';
import { Card } from '../../../../shared/components/ui';
import { bulkDeletePlayerRatings } from '../../../ranked/services/rankedService';
import { PlayerAdvancedSettingsModal } from './PlayerAdvancedSettingsModal';

interface RankedLeaderboardProps {
  board: any[];
  lbScope: 'competition' | 'global';
  setLbScope: (s: 'competition' | 'global') => void;
  onRefreshLeaderboard?: () => void;
  busy: boolean;
  competenciaId: string;
  modalidad: string;
  categoria: string;
  seasonId?: string;
}

export const RankedLeaderboard: React.FC<RankedLeaderboardProps> = ({
  board,
  lbScope,
  setLbScope,
  onRefreshLeaderboard,
  busy,
  competenciaId,
  modalidad,
  categoria,
  seasonId
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; competenciaId?: string; temporadaId?: string } | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === board.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(board.map(r => r.playerId));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} registros del leaderboard? Se borrarán sus puntos y PJs.`)) return;

    try {
      setDeleting(true);
      await bulkDeletePlayerRatings({
        playerIds: selectedIds,
        modalidad,
        categoria,
        competition: competenciaId,
        season: lbScope === 'competition' ? (seasonId || undefined) : undefined
      });
      setSelectedIds([]);
      onRefreshLeaderboard?.();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Error al borrar los registros');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-700">Leaderboard</h3>
            <button 
              onClick={onRefreshLeaderboard}
              disabled={busy}
              className="p-1 text-slate-400 hover:text-brand-600 transition-colors disabled:opacity-50"
              title="Actualizar tabla"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => {
                setLbScope('competition');
                setSelectedIds([]);
              }}
              className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${lbScope === 'competition' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              COMP.
            </button>
            <button 
              onClick={() => {
                setLbScope('global');
                setSelectedIds([]);
              }}
              className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${lbScope === 'global' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              GLOBAL
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] font-bold text-red-700">{selectedIds.length} seleccionados</span>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Borrando...' : 'Borrar de Tabla'}
            </button>
          </div>
        )}

        <div className="max-h-80 overflow-auto rounded border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-1 py-2 w-6 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-600"
                    checked={board.length > 0 && selectedIds.length === board.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-1 py-2 font-bold text-slate-600 text-center w-6">#</th>
                <th className="px-2 py-2 font-bold text-slate-600">Jugador</th>
                <th className="px-1 py-2 font-bold text-slate-600 text-center">MMR</th>
                <th className="px-1 py-2 font-bold text-slate-600 text-center hidden sm:table-cell">PJ</th>
                <th className="px-1 py-2 font-bold text-slate-600 text-center hidden sm:table-cell">%W</th>
                <th className="px-1 py-2 font-bold text-slate-600 text-center">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {board.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400 italic">No hay datos</td>
                </tr>
              ) : (
                board.map((r, idx) => (
                  <tr key={r.playerId} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(r.playerId) ? 'bg-brand-50/50' : ''}`}>
                    <td className="px-1 py-2 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-brand-600"
                        checked={selectedIds.includes(r.playerId)}
                        onChange={() => toggleSelect(r.playerId)}
                      />
                    </td>
                    <td className="px-1 py-2 text-center text-[10px] font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                    <td className="px-2 py-2 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-slate-700 truncate text-[11px] sm:text-xs" title={r.playerName || r.nombre}>
                          {r.playerName || r.nombre || `ID: ${r.playerId.slice(-4)}`}
                        </span>
                        <button 
                           onClick={() => setSelectedPlayer({ 
                             id: r.playerId, 
                             name: r.playerName || r.nombre || 'Desconocido',
                             competenciaId: r.competenciaId,
                             temporadaId: r.temporadaId
                           })}
                           className="p-1 text-slate-400 hover:text-brand-500 hover:bg-slate-100 transition-all rounded"
                           title="Ajustes avanzados"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                           </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-1 py-2 text-center text-[11px] sm:text-xs">
                      <span className="inline-block px-1 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">
                        {Math.round(r.rating)}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center text-slate-500 font-medium hidden sm:table-cell">{r.matchesPlayed}</td>
                    <td className="px-1 py-2 text-center text-slate-400 font-bold hidden sm:table-cell">
                      {r.matchesPlayed > 0 ? `${Math.round(((r.wins || 0) / r.matchesPlayed) * 100)}%` : '-'}
                    </td>
                    <td className="px-1 py-2 text-center text-[11px] sm:text-xs">
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

      {selectedPlayer && (
        <PlayerAdvancedSettingsModal 
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          modalidad={modalidad}
          categoria={categoria}
          competenciaId={selectedPlayer.competenciaId || (lbScope === 'competition' ? competenciaId : 'null')}
          seasonId={selectedPlayer.temporadaId || (lbScope === 'competition' ? (seasonId || 'null') : 'null')}
          onUpdated={onRefreshLeaderboard}
        />
      )}
    </>
  );
};
