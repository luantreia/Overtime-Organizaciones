import React, { useState } from 'react';
import { Button, Card } from '../../../../shared/components/ui';

interface RankedAdminToolsProps {
  convertId: string;
  setConvertId: (id: string) => void;
  onMarkAsRanked: () => void;
  revertId: string;
  setRevertId: (id: string) => void;
  onRevertMatch: () => void;
  onResetScopeRankings: () => void;
  onResetAllRankings: () => void;
  onRecalculateGlobalRankings: () => void;
  onSyncWins: () => void;
  onCleanupGhosts: () => void;
  busy: boolean;
  modalidad: string;
  categoria: string;
  selectedTemporada: string;
  recentMatches: any[];
  onEditResult: (m: any) => void;
}

export const RankedAdminTools: React.FC<RankedAdminToolsProps> = ({
  convertId,
  setConvertId,
  onMarkAsRanked,
  revertId,
  setRevertId,
  onRevertMatch,
  onResetScopeRankings,
  onResetAllRankings,
  onRecalculateGlobalRankings,
  onSyncWins,
  onCleanupGhosts,
  busy,
  modalidad,
  categoria,
  selectedTemporada,
  recentMatches,
  onEditResult
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4 border-slate-100 shadow-sm bg-white">
        <h3 className="mb-3 text-[11px] sm:text-sm font-bold text-slate-700 flex items-center justify-between">
          <span>Historial y Partidos Abiertos</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal uppercase">Mostrando {recentMatches.length}</span>
        </h3>
        <div className="space-y-2">
          {recentMatches.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">No hay partidos registrados en este scope</p>
          ) : (
            recentMatches.map((m) => {
              const isFinalizado = m.estado === 'finalizado';
              const matchId = (m.id || m._id || '').toString();
              return (
                <div key={matchId} className="flex flex-col p-2.5 rounded-lg border border-slate-100 bg-white hover:border-brand-200 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border">
                            ID: {matchId.slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${
                            isFinalizado ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'
                          }`}>
                            {isFinalizado ? 'Finalizado' : 'En Juego'}
                          </span>
                       </div>
                       <span className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(m.fecha).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <span className="text-base font-black text-red-600 leading-none">{m.marcadorLocal}</span>
                      <span className="text-[10px] text-slate-300 font-bold">VS</span>
                      <span className="text-base font-black text-blue-600 leading-none">{m.marcadorVisitante}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 py-2 border-y border-slate-50">
                     <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[9px] text-slate-400 font-medium uppercase">
                          {m.rojoPlayers?.length || 0} Jugadores
                        </span>
                     </div>
                     <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] text-slate-400 font-medium uppercase">
                          {m.azulPlayers?.length || 0} Jugadores
                        </span>
                     </div>
                  </div>

                  {isFinalizado && (m.ratingDeltas?.length > 0) && (
                    <div className="mb-3 px-2 py-1.5 bg-brand-50/50 rounded border border-brand-100 flex items-center justify-between">
                       <span className="text-[9px] font-bold text-brand-700 uppercase">
                          Deltas {selectedTemporada ? 'Temporada' : 'Global'}
                       </span>
                       <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-emerald-600">
                             Max: +{Math.max(...m.ratingDeltas.map((d: any) => d.delta || 0)).toFixed(1)}
                          </span>
                          <span className="text-[10px] font-bold text-red-600">
                             Min: {Math.min(...m.ratingDeltas.map((d: any) => d.delta || 0)).toFixed(1)}
                          </span>
                       </div>
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    variant={isFinalizado ? 'outline' : 'primary'} 
                    className={`w-full h-8 text-[10px] font-bold uppercase tracking-wider ${isFinalizado ? 'border-brand-200 text-brand-600 hover:bg-brand-50' : ''}`}
                    onClick={() => onEditResult(m)}
                    disabled={busy}
                  >
                    {isFinalizado ? 'Reabrir y Corregir' : 'Continuar Partido'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Herramientas Avanzadas
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="p-3 sm:p-4 border-amber-100 bg-amber-50/10">
            <h3 className="mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mantenimiento</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 col-span-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-bold border-amber-300 bg-white"
                  onClick={onCleanupGhosts}
                  disabled={busy}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar "Fantasmas" (0 PJ)
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Forzar Conversion Ranked</label>
                <div className="flex gap-2">
                  <input value={convertId} onChange={(e)=>setConvertId(e.target.value)} placeholder="Part. ID" className="flex-1 rounded-md border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-brand-500 min-w-0" />
                  <Button size="sm" onClick={onMarkAsRanked} disabled={busy || !convertId.trim()} className="h-8 text-[10px] px-2">Marcar</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-red-600">Revertir MMR Partido</label>
                <div className="flex gap-2">
                  <input value={revertId} onChange={(e)=>setRevertId(e.target.value)} placeholder="Part. ID" className="flex-1 rounded-md border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-red-500 min-w-0" />
                  <Button size="sm" variant="outline" className="h-8 text-[10px] px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={onRevertMatch} disabled={busy || !revertId.trim()}>Revertir</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-red-100 bg-red-50/10">
            <h3 className="mb-3 text-sm font-bold text-red-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Zona de Peligro (Resets)
            </h3>
            
            <div className="space-y-4">
              <div className="rounded-md bg-white p-3 border border-red-100 shadow-sm">
                <p className="mb-2 text-xs text-slate-600">
                  Resetea <strong>MMR y participaciones</strong> solo de: <span className="font-bold">{modalidad || 'N/A'} - {categoria || 'N/A'}</span>
                  {selectedTemporada ? ' en la temporada actual.' : ' global.'}
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-amber-700 border-amber-500 bg-amber-50 hover:bg-amber-100"
                  onClick={onResetScopeRankings} 
                  disabled={busy || !modalidad || !categoria}
                >
                  Resetear este Scope
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-brand-700 border-brand-500 bg-brand-50 hover:bg-brand-100"
                  onClick={onSyncWins} 
                  disabled={busy}
                >
                  Sincronizar Winrates
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
