import React, { useState } from 'react';
import { Button } from '../../../../shared/components/ui';
import { QuickAddPlayerModal } from './QuickAddPlayerModal';

interface Player {
  _id: string;
  nombre: string;
}

interface RankedPlayerSelectorProps {
  players: Player[];
  compPlayers: any[];
  filter: string;
  setFilter: (f: string) => void;
  selected: string[];
  toggleSelect: (id: string) => void;
  presentes: string[];
  togglePresente: (id: string, isPresent: boolean) => void;
  playedCounts: Record<string, number>;
  showAll: boolean;
  setShowAll: (val: boolean) => void;
  onAgregarJugador: (id: string) => void;
  onEliminarJugador: (id: string) => void;
  nuevoJugadorId: string;
  setNuevoJugadorId: (id: string) => void;
  onAgregarNuevoJugador: () => void;
  onQuickAddPlayer: (datos: { nombre: string; alias?: string; genero?: string }) => Promise<void>;
  onChooseForNext: () => void;
  onMarkAllPresent: () => void;
  onClearPresentes: () => void;
  onResetPJHoy: () => void;
  priorizarNoJugados: boolean;
  setPriorizarNoJugados: (val: boolean) => void;
  busy: boolean;
  onAutoAssign: () => void;
  onAddToRojo: () => void;
  onAddToAzul: () => void;
  matchActive: boolean;
}

export const RankedPlayerSelector: React.FC<RankedPlayerSelectorProps> = ({
  players,
  compPlayers,
  filter,
  setFilter,
  selected,
  toggleSelect,
  presentes,
  togglePresente,
  playedCounts,
  showAll,
  setShowAll,
  onAgregarJugador,
  onEliminarJugador,
  nuevoJugadorId,
  setNuevoJugadorId,
  onAgregarNuevoJugador,
  onQuickAddPlayer,
  onChooseForNext,
  onMarkAllPresent,
  onClearPresentes,
  onResetPJHoy,
  priorizarNoJugados,
  setPriorizarNoJugados,
  busy,
  onAutoAssign,
  onAddToRojo,
  onAddToAzul,
  matchActive
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const filtered = players.filter(p => !filter || p.nombre.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h2 className="text-sm font-semibold">Jugadores</h2>
          <div className="flex rounded border text-[10px] overflow-hidden">
            <button 
              type="button" 
              className={`px-2 py-1 ${!showAll ? 'bg-slate-200' : 'bg-white'}`} 
              onClick={() => setShowAll(false)}
            >
              Comp.
            </button>
            <button 
              type="button" 
              className={`px-2 py-1 ${showAll ? 'bg-slate-200' : 'bg-white'}`} 
              onClick={() => setShowAll(true)}
            >
              Todos
            </button>
          </div>
        </div>
        <input 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          placeholder="Buscar..." 
          className="w-full sm:w-auto rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-brand-500 outline-none" 
        />
      </div>

      <div className="h-64 sm:h-80 overflow-auto rounded border">
        {filtered.map((p) => {
          const isCompPlayer = compPlayers.some(cp => cp._id === p._id);
          const isPresent = presentes.includes(p._id);
          const isSelected = selected.includes(p._id);
          const pjHoy = playedCounts[p._id] || 0;

          return (
            <div key={p._id} className="flex flex-col gap-1.5 border-b px-2 py-2 text-sm hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleSelect(p._id)} 
                    className="rounded text-brand-600 shrink-0"
                  />
                  <span className="truncate text-xs sm:text-sm font-medium">{p.nombre}</span>
                </label>
                
                <div className="flex gap-1 shrink-0">
                  {showAll && !isCompPlayer && (
                    <button
                      type="button"
                      className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] hover:bg-slate-50 font-bold text-brand-600"
                      onClick={() => onAgregarJugador(p._id)}
                      disabled={busy}
                    >
                      Añadir
                    </button>
                  )}
                  {isCompPlayer && (
                    <button
                      type="button"
                      className="rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600 hover:bg-rose-100"
                      onClick={() => onEliminarJugador(p._id)}
                      disabled={busy}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 bg-slate-50/50 p-1 rounded">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPresent} 
                    onChange={(e) => togglePresente(p._id, e.target.checked)} 
                    className="rounded text-brand-600 shrink-0"
                  />
                  <span className="font-semibold uppercase tracking-tight">{isPresent ? 'Presente' : 'Ausente'}</span>
                </label>

                {pjHoy > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
                    PJ: {pjHoy}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 text-center sm:text-left">Seleccionados: {selected.length}</span>
            <Button 
              size="sm" 
              variant="outline"
              disabled={busy || !matchActive || selected.length < 2} 
              onClick={onAutoAssign}
              className="text-[10px] py-1 h-auto"
            >
              Auto-asignación balanceada
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 text-[10px] h-auto py-1.5"
              disabled={busy || selected.length === 0} 
              onClick={onAddToRojo}
            >
              Añadir a Rojo
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-[10px] h-auto py-1.5"
              disabled={busy || selected.length === 0} 
              onClick={onAddToAzul}
            >
              Añadir a Azul
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t">
          <input 
            value={nuevoJugadorId} 
            onChange={(e) => setNuevoJugadorId(e.target.value)} 
            placeholder="ID..." 
            className="flex-1 rounded-md border px-2 py-1 text-[10px] min-w-0" 
          />
          <Button size="sm" variant="outline" className="h-7 px-2 text-[9px] whitespace-nowrap" onClick={onAgregarNuevoJugador} disabled={busy || !nuevoJugadorId.trim()}>
            + Comp.
          </Button>
          <Button size="sm" variant="primary" className="h-7 px-2 text-[9px] whitespace-nowrap" onClick={() => setIsQuickAddOpen(true)} disabled={busy}>
            + Nuevo
          </Button>
        </div>

        <QuickAddPlayerModal 
          isOpen={isQuickAddOpen} 
          onClose={() => setIsQuickAddOpen(false)} 
          onSuccess={async (datos) => {
            await onQuickAddPlayer(datos);
            setIsQuickAddOpen(false);
          }}
        />

        <div className="space-y-2 pt-2 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[10px] font-medium text-slate-600 cursor-pointer justify-center">
              <input 
                type="checkbox" 
                checked={priorizarNoJugados} 
                onChange={(e) => setPriorizarNoJugados(e.target.checked)} 
                className="rounded text-brand-600 shrink-0"
              />
              <span>Priorizar descanso</span>
            </label>
            <Button size="sm" variant="outline" className="text-[9px] h-7 px-2 w-full sm:w-auto" onClick={onChooseForNext}>
              Elegir próximos
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <button type="button" className="text-[9px] text-slate-500 hover:text-brand-600" onClick={onMarkAllPresent}>Todos presentes</button>
            <button type="button" className="text-[9px] text-slate-500 hover:text-brand-600" onClick={onClearPresentes}>Limpiar lista</button>
            <button type="button" className="text-[9px] text-red-500 hover:text-red-700 font-medium" onClick={onResetPJHoy}>Reset PJ diario</button>
          </div>
        </div>
      </div>
    </div>
  );
};
