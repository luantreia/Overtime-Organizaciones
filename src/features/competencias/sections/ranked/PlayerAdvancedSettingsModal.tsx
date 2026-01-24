import React, { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui';
import { getPlayerRatingDetail, recalculatePlayerRating, deletePlayerRating } from '../../../ranked/services/rankedService';

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

  const fetchDetail = async () => {
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
  };

  useEffect(() => {
    if (isOpen && playerId) {
      fetchDetail();
    }
  }, [isOpen, playerId]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 truncate">Ajustes: {playerName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400">Cargando detalles...</div>
        ) : (
          <div className="overflow-auto flex-1 space-y-6 pr-1">
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Rating Actual</p>
                   <p className="text-2xl font-black text-brand-600">{Math.round(rating?.rating || 1500)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Partidos Jugados</p>
                   <p className="text-2xl font-black text-slate-700">{rating?.matchesPlayed || 0}</p>
                </div>
             </div>

             <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">Historial de Snapshots (MatchPlayer)</h3>
                <div className="border rounded-lg overflow-hidden divide-y text-xs bg-white">
                   {history.length === 0 ? (
                     <div className="p-4 text-center text-slate-400 italic">No hay partidos registrados para este jugador en este contexto.</div>
                   ) : (
                     <table className="w-full">
                        <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase">
                           <tr>
                              <th className="p-2 text-left">Fecha / Partido</th>
                              <th className="p-2 text-center">Color</th>
                              <th className="p-2 text-center">Delta</th>
                              <th className="p-2 text-center">Score</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {history.map((h, i) => (
                             <tr key={h._id} className="hover:bg-slate-50">
                                <td className="p-2">
                                   <p className="font-bold">{new Date(h.partidoId?.fecha || h.createdAt).toLocaleDateString()}</p>
                                   <p className="text-[9px] text-slate-400">ID: {(h.partidoId?._id || h.partidoId || '').slice(-6)}</p>
                                </td>
                                <td className="p-2 text-center">
                                   <span className={`px-1 rounded text-[10px] font-bold ${h.teamColor === 'rojo' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {h.teamColor?.toUpperCase()}
                                   </span>
                                </td>
                                <td className="p-2 text-center font-black">
                                   <span className={h.delta > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                      {h.delta > 0 ? `+${h.delta}` : h.delta}
                                   </span>
                                </td>
                                <td className="p-2 text-center text-slate-500">
                                   {h.partidoId?.marcadorLocal} - {h.partidoId?.marcadorVisitante}
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
