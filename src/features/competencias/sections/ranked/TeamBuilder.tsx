import React from 'react';
import { Button } from '../../../../shared/components/ui';

interface TeamBuilderProps {
  rojo: string[];
  azul: string[];
  nameById: (id: string) => string;
  onRemoveFromRojo: (id: string) => void;
  onRemoveFromAzul: (id: string) => void;
  onSaveAssignment: () => void;
  busy: boolean;
  matchActive: boolean;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  rojo,
  azul,
  nameById,
  onRemoveFromRojo,
  onRemoveFromAzul,
  onSaveAssignment,
  busy,
  matchActive
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 h-fit">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-black text-white">2</span>
          Armar Equipos
        </h2>
        <div>
          <h3 className="mb-2 text-sm font-bold text-red-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Rojo
            </span>
            <span className="text-[10px] font-normal text-slate-400">{rojo.length}/9</span>
          </h3>
          <div className="min-h-[80px] sm:min-h-[100px] rounded-md border border-red-50 bg-red-50/20 p-2">
            {rojo.length === 0 ? (
              <p className="text-[9px] text-red-300 text-center py-4 italic">Seleccioná jugadores de la lista</p>
            ) : (
              <ul className="space-y-1">
                {rojo.map((id) => (
                  <li key={typeof id === 'string' ? id : ((id as any)?._id || Math.random().toString())} className="group flex items-center justify-between rounded bg-white px-2 py-1 sm:py-1.5 text-xs shadow-sm ring-1 ring-red-100">
                    <span className="font-medium truncate pr-2">
                       {(() => {
                         const name = nameById(id);
                         if (typeof name !== 'string') return (name as any)?.nombre || 'Jugador';
                         return name;
                       })()}
                    </span>
                    <button
                      type="button"
                      className="h-6 w-6 flex items-center justify-center rounded text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      onClick={() => onRemoveFromRojo(id)}
                      title="Quitar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-blue-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Azul
            </span>
            <span className="text-[10px] font-normal text-slate-400">{azul.length}/9</span>
          </h3>
          <div className="min-h-[80px] sm:min-h-[100px] rounded-md border border-blue-50 bg-blue-50/20 p-2">
            {azul.length === 0 ? (
              <p className="text-[9px] text-blue-300 text-center py-4 italic">Seleccioná jugadores de la lista</p>
            ) : (
              <ul className="space-y-1">
                {azul.map((id) => (
                  <li key={typeof id === 'string' ? id : ((id as any)?._id || Math.random().toString())} className="group flex items-center justify-between rounded bg-white px-2 py-1 sm:py-1.5 text-xs shadow-sm ring-1 ring-blue-100">
                    <span className="font-medium truncate pr-2">
                       {(() => {
                         const name = nameById(id);
                         if (typeof name !== 'string') return (name as any)?.nombre || 'Jugador';
                         return name;
                       })()}
                    </span>
                    <button
                      type="button"
                      className="h-6 w-6 flex items-center justify-center rounded text-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                      onClick={() => onRemoveFromAzul(id)}
                      title="Quitar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button 
            className="w-full py-2.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wide"
            variant="primary"
            onClick={onSaveAssignment} 
            disabled={busy || !matchActive || (rojo.length === 0 && azul.length === 0)}
          >
            Confirmar Equipos
          </Button>
          <p className="mt-2 text-[9px] text-slate-400 text-center italic leading-tight">
            Debes confirmar los equipos para registrar los Partidos Jugados (PJ).
          </p>
        </div>
      </div>
    </div>
  );
};
