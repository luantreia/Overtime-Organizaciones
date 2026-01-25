import React from 'react';

interface RankedAFKSectionProps {
  rojoIds: string[];
  azulIds: string[];
  afkPlayers: string[];
  onToggleAFK: (id: string) => void;
  nameById: (id: string) => string;
}

export const RankedAFKSection: React.FC<RankedAFKSectionProps> = ({
  rojoIds,
  azulIds,
  afkPlayers,
  onToggleAFK,
  nameById
}) => {
  if (rojoIds.length === 0 && azulIds.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-white/40 rounded-lg border border-slate-100">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Reportar AFK / Abandono (Doble Penalización)</h3>
      <div className="flex flex-wrap gap-1.5">
        {[...rojoIds, ...azulIds].map(id => {
          const isAFK = afkPlayers.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggleAFK(id)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${
                isAFK 
                  ? 'bg-red-500 border-red-600 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500'
              }`}
            >
              {(() => {
                const name = nameById(id);
                if (typeof name !== 'string') return (name as any)?.nombre || 'Jugador';
                return name.split(' ')[0];
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
