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
  selectedTemporada
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración Avanzada y Herramientas Admin
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="p-4 border-amber-100 bg-amber-50/10">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Mantenimiento de Partidos</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Forzar Conversion Ranked</label>
                <div className="flex gap-2">
                  <input value={convertId} onChange={(e)=>setConvertId(e.target.value)} placeholder="ID de partido" className="flex-1 rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-brand-500" />
                  <Button size="sm" onClick={onMarkAsRanked} disabled={busy || !convertId.trim()}>Marcar</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-red-600">Revertir MMR Partido</label>
                <div className="flex gap-2">
                  <input value={revertId} onChange={(e)=>setRevertId(e.target.value)} placeholder="ID de partido" className="flex-1 rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-red-500" />
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onRevertMatch} disabled={busy || !revertId.trim()}>Revertir</Button>
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
