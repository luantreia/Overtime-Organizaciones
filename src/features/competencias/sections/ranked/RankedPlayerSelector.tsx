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
          placeholder="Buscar..." 
          className="w-full sm:w-auto rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-brand-500 outline-none" 
        />
      </div>

      <div className="h-64 sm:h-80 overflow-auto rounded border divide-y">
        {filtered.map((p, idx) => {
          const isCompPlayer = compPlayers.some(cp => cp._id === p._id);
          const isPresent = presentes.includes(p._id);
          const isSelected = selected.includes(p._id);
          const pjHoy = playedCounts[p._id] || 0;

          return (
            <div key={p._id} className="flex flex-col gap-1 px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[9px] font-mono text-slate-300 w-4 shrink-0">{idx + 1}</span>
                  <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelect(p._id)} 
                      className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                    />
                    <span className="truncate text-[11px] sm:text-xs font-bold text-slate-700">{p.nombre}</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="flex items-center rounded-full p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors">
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
                <div className="flex items-center gap-1.5">
                  {pjHoy > 0 && (
                    <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-100">
                      PJ: {pjHoy}
                    </span>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={() => togglePresente(p._id, !isPresent)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all border ${
                    isPresent 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isPresent ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isPresent ? 'Presente' : 'Ausente'}
                </button>
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
