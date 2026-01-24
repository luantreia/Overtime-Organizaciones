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
                <div key={matchId} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-[8px] sm:text-[10px] font-mono text-slate-400 uppercase truncate">ID: {matchId.slice(-6).toUpperCase()}</span>
                      <span className={`text-[7px] sm:text-[8px] font-bold px-1 rounded uppercase tracking-tighter shrink-0 ${
                        isFinalizado ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700 animate-pulse'
                      }`}>
                        {isFinalizado ? 'Final' : 'Abierto'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-red-600 leading-none">{m.marcadorLocal}</span>
                      <span className="text-xs text-slate-300 leading-none">-</span>
                      <span className="text-sm font-black text-blue-600 leading-none">{m.marcadorVisitante}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={isFinalizado ? 'outline' : 'primary'} 
                    className={`h-7 text-[10px] sm:text-xs ${isFinalizado ? 'border-slate-200 bg-white' : 'px-4'}`}
                    onClick={() => onEditResult(m)}
                    disabled={busy}
                  >
                    {isFinalizado ? 'Corregir' : 'Continuar'}
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
                  className="text-red-700 border-red-500 bg-red-50 hover:bg-red-100"
                  onClick={onResetAllRankings} 
                  disabled={busy}
                >
                  Reset TODO el Sistema
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-orange-700 border-orange-500 bg-orange-50 hover:bg-orange-100"
                  onClick={onRecalculateGlobalRankings} 
                  disabled={busy}
                >
                  Regenerar ELO Global
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
