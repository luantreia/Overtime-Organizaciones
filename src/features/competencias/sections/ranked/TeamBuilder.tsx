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
    <div className="rounded-lg border border-slate-200 bg-white p-4 h-fit">
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-bold text-red-600 flex items-center justify-between">
            <span>Rojo</span>
            <span className="text-xs font-normal text-slate-500">{rojo.length}/9</span>
          </h2>
          <div className="min-h-[100px] rounded-md border border-red-50 bg-red-50/30 p-2">
            {rojo.length === 0 ? (
              <p className="text-[10px] text-red-300 text-center py-4 italic">Sin jugadores</p>
            ) : (
              <ul className="space-y-1">
                {rojo.map((id) => (
                  <li key={id} className="group flex items-center justify-between rounded bg-white px-2 py-1.5 text-xs shadow-sm ring-1 ring-red-100">
                    <span className="font-medium">{nameById(id)}</span>
                    <button 
                      type="button" 
                      className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" 
                      onClick={() => onRemoveFromRojo(id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-blue-600 flex items-center justify-between">
            <span>Azul</span>
            <span className="text-xs font-normal text-slate-500">{azul.length}/9</span>
          </h2>
          <div className="min-h-[100px] rounded-md border border-blue-50 bg-blue-50/30 p-2">
            {azul.length === 0 ? (
              <p className="text-[10px] text-blue-300 text-center py-4 italic">Sin jugadores</p>
            ) : (
              <ul className="space-y-1">
                {azul.map((id) => (
                  <li key={id} className="group flex items-center justify-between rounded bg-white px-2 py-1.5 text-xs shadow-sm ring-1 ring-blue-100">
                    <span className="font-medium">{nameById(id)}</span>
                    <button 
                      type="button" 
                      className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-opacity" 
                      onClick={() => onRemoveFromAzul(id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button 
            className="w-full"
            variant="primary"
            onClick={onSaveAssignment} 
            disabled={busy || !matchActive || (rojo.length === 0 && azul.length === 0)}
          >
            Guardar Formación
          </Button>
          <p className="mt-2 text-[10px] text-slate-400 text-center italic">
            Guardar equipos antes de finalizar para asegurar los PJ.
          </p>
        </div>
      </div>
    </div>
  );
};
