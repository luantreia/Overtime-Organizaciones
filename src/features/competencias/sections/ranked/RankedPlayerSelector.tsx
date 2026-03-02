import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  EllipsisVerticalIcon, 
  TrashIcon, 
  UserPlusIcon,
} from '@heroicons/react/20/solid';
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
  lastMatchPlayedIndex?: Record<string, number>;
  matchTimelineLength?: number;
  togglePresente: (id: string, isPresent: boolean) => void;
  playedCounts: Record<string, number>;
  showAll: boolean;
  setShowAll: (val: boolean) => void;
  onAgregarJugador: (id: string) => void;
  onEliminarJugador: (id: string) => void;
  onQuickAddPlayer: (datos: { 
    nombre: string; 
    alias?: string; 
    genero?: string; 
    fechaNacimiento?: string;
  }) => Promise<void>;
  onChooseForNext: () => void;
  onMarkAllPresent: () => void;
  onClearPresentes: () => void;
  onClearSelected: () => void;
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
  onQuickAddPlayer,
  onChooseForNext,
  onMarkAllPresent,
  onClearPresentes,
  onClearSelected,
  onResetPJHoy,
  priorizarNoJugados,
  setPriorizarNoJugados,
  busy,
  onAutoAssign,
  onAddToRojo,
  onAddToAzul,
  matchActive,
  lastMatchPlayedIndex = {},
  matchTimelineLength = 0
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const filtered = players.filter(p => !filter || p.nombre.toLowerCase().includes(filter.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filter.trim() && filtered.length > 0) {
      const topPlayer = filtered[0];
      if (!presentes.includes(topPlayer._id)) {
        togglePresente(topPlayer._id, true);
        setFilter('');
      }
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold">Jugadores</h2>
          <div className="flex rounded border text-[10px] overflow-hidden">
            <button 
              type="button" 
              className={`px-2 py-1 ${!showAll ? 'bg-slate-200 font-bold' : 'bg-white'}`} 
              onClick={() => setShowAll(false)}
            >
              Comp.
            </button>
            <button 
              type="button" 
              className={`px-2 py-1 ${showAll ? 'bg-slate-200 font-bold' : 'bg-white'}`} 
              onClick={() => setShowAll(true)}
            >
              Todos
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setIsQuickAddOpen(true)}
            disabled={busy}
            className="rounded bg-brand-600 px-1.5 py-1 text-[10px] font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            + NUEVO
          </button>
        </div>
        <input 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="Buscar... (Enter p/ check-in)" 
          className="w-full sm:w-auto rounded-md border px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500 outline-none" 
        />
      </div>

      <div className="h-64 sm:h-[450px] overflow-auto rounded border divide-y bg-slate-50/30">
        {/* Grupos Dinámicos */}
        {[
          { label: 'Presentes y Listos', items: filtered.filter(p => presentes.includes(p._id)), color: 'text-emerald-600' },
          { label: 'Ausentes / Por llegar', items: filtered.filter(p => !presentes.includes(p._id)), color: 'text-slate-400' }
        ].map((group, gIdx) => (
          group.items.length > 0 && (
            <div key={gIdx} className="bg-white">
              <div className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 px-3 py-1.5 flex items-center justify-between border-b border-slate-200">
                <span className={`text-[10px] uppercase font-black tracking-tight ${group.color}`}>
                  {group.label} ({group.items.length})
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {group.items.map((p) => {
                  const isCompPlayer = compPlayers.some(cp => cp._id === p._id);
                  const isPresent = presentes.includes(p._id);
                  const isSelected = selected.includes(p._id);
                  const pjHoy = playedCounts[p._id] || 0;
                  
                  // Calcular descanso (Recency Bias)
                  const lastIdx = lastMatchPlayedIndex[p._id] || 0;
                  const rest = lastIdx > 0 ? (matchTimelineLength - lastIdx) : -1;

                  return (
                    <div key={p._id} className={`flex flex-col gap-1 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-brand-50/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleSelect(p._id)} 
                              className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span className={`truncate text-[11px] sm:text-xs font-bold ${isPresent ? 'text-slate-800' : 'text-slate-400 font-medium italic'}`}>
                              {p.nombre}
                            </span>
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Botón de Presencia Mini */}
                          <button 
                            type="button"
                            onClick={() => togglePresente(p._id, !isPresent)}
                            className={`h-3 w-3 rounded-full transition-all border-2 ${
                              isPresent 
                                ? 'bg-emerald-500 border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                                : 'bg-slate-200 border-slate-100'
                            }`}
                          />
                          
                          <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className="flex items-center rounded-full p-0.5 text-slate-300 hover:text-brand-600 transition-colors">
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-10 mt-1 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  {showAll && !isCompPlayer ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => onAgregarJugador(p._id)}
                                          className={`${
                                            active ? 'bg-slate-100 text-brand-700' : 'text-slate-700'
                                          } flex w-full items-center px-3 py-1.5 text-[10px] font-medium`}
                                        >
                                          <UserPlusIcon className="mr-2 h-3.5 w-3.5 text-brand-500" />
                                          Añadir a Competencia
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : isCompPlayer ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => onEliminarJugador(p._id)}
                                          className={`${
                                            active ? 'bg-rose-50 text-rose-700' : 'text-rose-700'
                                          } flex w-full items-center px-3 py-1.5 text-[10px] font-medium`}
                                        >
                                          <TrashIcon className="mr-2 h-3.5 w-3.5 text-rose-500" />
                                          Quitar
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : null}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 pl-5.5">
                          {/* PJ Hoy */}
                          <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black border ${
                            pjHoy === 0 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            PJ: {pjHoy}
                          </span>

                          {/* Descanso (D: X) */}
                          {isPresent && rest >= 0 && (
                            <span 
                              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black border ${
                                rest === 0 
                                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                                  : rest >= 2 
                                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                              title="Partidos desde su última participación"
                            >
                              {rest === 0 ? 'RECIENTE' : `D: ${rest}`}
                            </span>
                          )}
                        </div>

                        <span className={`text-[8px] font-black uppercase tracking-tighter ${isPresent ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {isPresent ? 'LISTO' : 'FUERA'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
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
            <button type="button" className="text-[9px] text-slate-500 hover:text-brand-600" onClick={onClearPresentes}>Limpiar presentes</button>
            <button type="button" className="text-[9px] text-slate-500 hover:text-brand-600" onClick={onClearSelected} disabled={selected.length === 0}>Deseleccionar ({selected.length})</button>
            <button type="button" className="text-[9px] text-red-500 hover:text-red-700 font-medium" onClick={onResetPJHoy}>Reset PJ diario</button>
          </div>
        </div>
      </div>
    </div>
  );
};
