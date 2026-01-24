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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Jugadores</h2>
          <div className="flex rounded border text-xs overflow-hidden">
            <button 
              type="button" 
              className={`px-2 py-1 ${!showAll ? 'bg-slate-200' : 'bg-white'}`} 
              onClick={() => setShowAll(false)}
            >
              Sólo competencia
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
          className="rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-brand-500 outline-none" 
        />
      </div>

      <div className="h-80 overflow-auto rounded border">
        {filtered.map((p) => {
          const isCompPlayer = compPlayers.some(cp => cp._id === p._id);
          const isPresent = presentes.includes(p._id);
          const isSelected = selected.includes(p._id);
          const pjHoy = playedCounts[p._id] || 0;

          return (
            <div key={p._id} className="flex items-center justify-between gap-2 border-b px-2 py-1 text-sm hover:bg-slate-50">
              <label className="flex flex-1 items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggleSelect(p._id)} 
                  className="rounded text-brand-600"
                />
                <span className="truncate">{p.nombre}</span>
              </label>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPresent} 
                    onChange={(e) => togglePresente(p._id, e.target.checked)} 
                    className="rounded text-brand-600"
                  />
                  <span>Presente</span>
                  {pjHoy > 0 && (
                    <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      PJ: {pjHoy}
                    </span>
                  )}
                </label>

                {showAll && !isCompPlayer && (
                  <button
                    type="button"
                    className="shrink-0 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] hover:bg-slate-50"
                    onClick={() => onAgregarJugador(p._id)}
                    disabled={busy}
                  >
                    Agregar
                  </button>
                )}
                {isCompPlayer && (
                  <button
                    type="button"
                    className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 hover:bg-red-100"
                    onClick={() => onEliminarJugador(p._id)}
                    disabled={busy}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Seleccionados: {selected.length}</span>
            <Button 
              size="sm" 
              variant="outline"
              disabled={busy || !matchActive || selected.length < 2} 
              onClick={onAutoAssign}
            >
              Auto-assign balanceado
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={busy || selected.length === 0} 
              onClick={onAddToRojo}
            >
              Añadir a Rojo
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={busy || selected.length === 0} 
              onClick={onAddToAzul}
            >
              Añadir a Azul
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <input 
            value={nuevoJugadorId} 
            onChange={(e) => setNuevoJugadorId(e.target.value)} 
            placeholder="ID manual..." 
            className="flex-1 rounded-md border px-2 py-1 text-xs" 
          />
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={onAgregarNuevoJugador} disabled={busy || !nuevoJugadorId.trim()}>
            + Comp.
          </Button>
          <Button size="sm" variant="primary" className="h-7 text-[10px]" onClick={() => setIsQuickAddOpen(true)} disabled={busy}>
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
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1 text-[10px] font-medium text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={priorizarNoJugados} 
                onChange={(e) => setPriorizarNoJugados(e.target.checked)} 
                className="rounded text-brand-600"
              />
              <span>Priorizar no jugados</span>
            </label>
            <Button size="sm" variant="outline" className="text-[10px] h-7 px-2" onClick={onChooseForNext}>
              Elegir para próximo match
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button type="button" className="text-[10px] text-slate-500 hover:underline" onClick={onMarkAllPresent}>Marcar presentes</button>
            <button type="button" className="text-[10px] text-slate-500 hover:underline" onClick={onClearPresentes}>Limpiar presentes</button>
            <button type="button" className="text-[10px] text-red-500 hover:underline" onClick={onResetPJHoy}>Reset PJ hoy</button>
          </div>
        </div>
      </div>
    </div>
  );
};
