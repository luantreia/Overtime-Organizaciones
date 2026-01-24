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
        <div>
          <h2 className="mb-2 text-sm font-bold text-red-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Rojo
            </span>
            <span className="text-[10px] font-normal text-slate-400">{rojo.length}/9</span>
          </h2>
          <div className="min-h-[80px] sm:min-h-[100px] rounded-md border border-red-50 bg-red-50/20 p-2">
            {rojo.length === 0 ? (
              <p className="text-[9px] text-red-300 text-center py-4 italic">Arrastra o añade jugadores</p>
            ) : (
              <ul className="space-y-1">
                {rojo.map((id) => (
                  <li key={id} className="group flex items-center justify-between rounded bg-white px-2 py-1 sm:py-1.5 text-xs shadow-sm ring-1 ring-red-100">
                    <span className="font-medium truncate pr-2">{nameById(id)}</span>
                    <button 
                      type="button" 
                      className="text-[9px] text-red-400 hover:text-red-600 font-bold uppercase transition-colors" 
                      onClick={() => onRemoveFromRojo(id)}
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-blue-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Azul
            </span>
            <span className="text-[10px] font-normal text-slate-400">{azul.length}/9</span>
          </h2>
          <div className="min-h-[80px] sm:min-h-[100px] rounded-md border border-blue-50 bg-blue-50/20 p-2">
            {azul.length === 0 ? (
              <p className="text-[9px] text-blue-300 text-center py-4 italic">Arrastra o añade jugadores</p>
            ) : (
              <ul className="space-y-1">
                {azul.map((id) => (
                  <li key={id} className="group flex items-center justify-between rounded bg-white px-2 py-1 sm:py-1.5 text-xs shadow-sm ring-1 ring-blue-100">
                    <span className="font-medium truncate pr-2">{nameById(id)}</span>
                    <button 
                      type="button" 
                      className="text-[9px] text-blue-400 hover:text-blue-600 font-bold uppercase transition-colors" 
                      onClick={() => onRemoveFromAzul(id)}
                    >
                      X
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
