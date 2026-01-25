import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../../shared/components/ui';
import { getPlayerRatingDetail, recalculatePlayerRating, deletePlayerRating, deleteMatchPlayerSnapshot } from '../../../ranked/services/rankedService';

interface PlayerAdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  modalidad: string;
  categoria: string;
  competenciaId: string;
  seasonId?: string;
  onUpdated?: () => void;
}

export const PlayerAdvancedSettingsModal: React.FC<PlayerAdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  modalidad,
  categoria,
  competenciaId,
  seasonId,
  onUpdated
}) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [rating, setRating] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlayerRatingDetail(playerId, {
        modalidad,
        categoria,
        competition: competenciaId,
        season: seasonId
      });
      setRating(res.rating);
      setHistory(res.history);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [playerId, modalidad, categoria, competenciaId, seasonId]);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchDetail();
    }
  }, [isOpen, playerId, fetchDetail]);

  const handleRecalculate = async () => {
    setBusy(true);
    try {
      await recalculatePlayerRating(playerId, {
        modalidad,
        categoria,
        competition: competenciaId,
        season: seasonId
      });
      await fetchDetail();
      onUpdated?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro? Se borrará el registro de este jugador en este ranking. No borra al jugador del sistema, solo su ranking actual.')) return;
    setBusy(true);
    try {
      await deletePlayerRating(playerId, {
        modalidad,
        categoria,
        competition: competenciaId,
        season: seasonId
      });
      onUpdated?.();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de partido? El MMR del jugador se recalculará automáticamente sin estos puntos.')) return;
    setBusy(true);
    try {
      await deleteMatchPlayerSnapshot(id);
      await fetchDetail();
      onUpdated?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-3 sm:p-6 shadow-xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-xl font-bold text-slate-900 truncate">Ajustes: {playerName}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 font-bold text-2xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400">Cargando detalles...</div>
        ) : (
          <div className="overflow-auto flex-1 space-y-4 sm:space-y-6 pr-1">
             <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Rating Actual</p>
                   <p className="text-xl sm:text-2xl font-black text-brand-600">{Math.round(rating?.rating || 1500)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">PJ</p>
                   <p className="text-xl sm:text-2xl font-black text-slate-700">{rating?.matchesPlayed || 0}</p>
                </div>
             </div>

             <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700">Historial de Partidos</h3>
                <div className="border rounded-lg overflow-hidden divide-y text-[11px] sm:text-xs bg-white">
                   {history.length === 0 ? (
                     <div className="p-4 text-center text-slate-400 italic">No hay partidos registrados.</div>
                   ) : (
                     <table className="w-full">
                        <thead className="bg-slate-50 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">
                           <tr>
                              <th className="p-2 text-left">Fecha</th>
                              <th className="p-2 text-center">Res</th>
                              <th className="p-2 text-center hidden sm:table-cell">Color</th>
                              <th className="p-2 text-center">Delta</th>
                              <th className="p-2 text-center hidden xs:table-cell">Score</th>
                              <th className="p-2 text-center w-8"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {history.map((h, i) => (
                             <tr key={h._id} className="hover:bg-slate-50">
                                <td className="p-1.5 sm:p-2">
                                   <p className="font-bold">{new Date(h.partidoId?.fecha || h.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</p>
                                   <p className="text-[8px] text-slate-400">..{(h.partidoId?._id || h.partidoId || '').slice(-4)}</p>
                                </td>
                                <td className="p-1.5 sm:p-2 text-center">
                                   <div className="flex flex-col items-center">
                                      {(h.win === true || (h.win === undefined && h.delta > 0)) ? (
                                        <span className="text-emerald-600 font-black">W</span>
                                      ) : (
                                        <span className="text-red-400 font-bold">L</span>
                                      )}
                                      {h.isAFK && (
                                        <span className="bg-red-500 text-white text-[7px] px-1 rounded font-bold animate-pulse">AFK</span>
                                      )}
                                   </div>
                                </td>
                                <td className="p-1.5 sm:p-2 text-center hidden sm:table-cell">
                                   <span className={`px-1 rounded text-[9px] font-bold ${h.teamColor === 'rojo' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {h.teamColor?.toUpperCase().slice(0,3)}
                                   </span>
                                </td>
                                <td className="p-1.5 sm:p-2 text-center font-black">
                                   <div className="flex flex-col items-center">
                                      <span className={`${h.delta > 0 ? 'text-emerald-500' : 'text-red-500'} text-xs`}>
                                         {h.delta > 0 ? `+${h.delta}` : h.delta}
                                      </span>
                                   </div>
                                </td>
                                <td className="p-1.5 sm:p-2 text-center text-slate-500 hidden xs:table-cell">
                                   {h.partidoId?.marcadorLocal}-{h.partidoId?.marcadorVisitante}
                                </td>
                                <td className="p-1.5 sm:p-2 text-center">
                                   <button 
                                      onClick={() => handleDeleteSnapshot(h._id)}
                                      disabled={busy}
                                      className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                                   >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                         <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                   </button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   )}
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t">
                <div className="p-3 bg-amber-50 rounded border border-amber-100 mb-2">
                   <p className="text-xs text-amber-800 flex gap-2">
                      <span className="font-bold">⚠️ Zona de Reparación:</span>
                      Úsalo si el contador de partidos o el ELO no cuadran tras un error del sistema.
                   </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                   <Button 
                      onClick={handleRecalculate} 
                      disabled={busy} 
                      variant="outline"
                      className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-100"
                   >
                      Recalcular MMR desde Snapshots
                   </Button>
                   <Button 
                      onClick={handleDelete} 
                      disabled={busy} 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                   >
                      Eliminar Registro Categoría
                   </Button>
                </div>
             </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600 text-center font-bold px-2 py-1 bg-red-50 rounded">{error}</p>}

        <div className="pt-6">
           <Button variant="outline" className="w-full" onClick={onClose} disabled={busy}>
              Cerrar
           </Button>
        </div>
      </div>
    </div>
  );
};
