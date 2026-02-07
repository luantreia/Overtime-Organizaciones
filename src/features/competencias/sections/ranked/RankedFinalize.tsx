import React, { useState } from 'react';
import { Button, Card } from '../../../../shared/components/ui';
import { MatchTimer } from './MatchTimer';
import { RankedMatchSettingsModal } from './RankedMatchSettingsModal';
import { RankedLeaderboard } from './RankedLeaderboard';
import { RankedAFKSection } from './RankedAFKSection';

interface RankedFinalizeProps {
  score: { local: number; visitante: number };
  sets: { winner: 'local' | 'visitante'; time: number }[];
  addSet: (winner: 'local' | 'visitante') => void;
  removeLastSet: () => void;
  adjustScore: (team: 'local' | 'visitante', delta: number) => void;
  onFinalize: (afkIds?: string[]) => void;
  busy: boolean;
  matchActive: boolean;
  board: any[];
  lbScope: 'competition' | 'global';
  setLbScope: (s: 'competition' | 'global') => void;
  startTime: number | null;
  accumulatedTime?: number;
  isPaused?: boolean;
  getEffectiveElapsed?: () => number;
  togglePause?: () => void;
  startNextSet?: () => void;
  setStartTime?: (val: number | null) => void;
  currentSetStartTime?: number;
  isWaitingForNextSet?: boolean;
  startTimer: () => void;
  onRefreshLeaderboard?: () => void;
  competenciaId: string;
  modalidad: string;
  categoria: string;
  seasonId?: string;
  seasonName?: string;
  rojoIds?: string[];
  azulIds?: string[];
  nameById?: (id: string) => string;
  matchId?: string | null;
  matchConfig?: { 
    matchDuration: number; 
    setDuration: number; 
    useSuddenDeath: boolean;
    autoPauseGlobal?: boolean;
    enableCountdown?: boolean;
    enableWhistle?: boolean;
    voiceVolume?: number;
    buzzerVolume?: number;
    voiceRate?: number;
    voiceIndex?: number;
  };
  isBasicMode?: boolean;
  onUpdateConfig?: (config: Partial<{ 
    matchDuration: number; 
    setDuration: number; 
    useSuddenDeath: boolean;
    autoPauseGlobal?: boolean;
    enableCountdown?: boolean;
    enableWhistle?: boolean;
    voiceVolume?: number;
    buzzerVolume?: number;
    voiceRate?: number;
    voiceIndex?: number;
  }>) => Promise<void>;
}

export const RankedFinalize: React.FC<RankedFinalizeProps> = ({
  score,
  sets,
  addSet,
  removeLastSet,
  adjustScore,
  onFinalize,
  busy,
  matchActive,
  board,
  lbScope,
  setLbScope,
  startTime,
  accumulatedTime,
  isPaused,
  getEffectiveElapsed,
  togglePause,
  startNextSet,
  setStartTime,
  currentSetStartTime = 0,
  isWaitingForNextSet = false,
  startTimer,
  onRefreshLeaderboard,
  competenciaId,
  modalidad,
  categoria,
  seasonId,
  seasonName,
  rojoIds = [],
  azulIds = [],
  nameById = (id) => id,
  matchId,
  matchConfig,
  isBasicMode,
  onUpdateConfig
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [afkPlayers, setAfkPlayers] = useState<string[]>([]);

  const handleEditTimer = () => {
    if (!setStartTime) return;
    const val = prompt('Minutos transcurridos del partido (ej 5.5):');
    if (val && !isNaN(+val)) {
      const ms = parseFloat(val) * 60 * 1000;
      setStartTime(Date.now() - ms);
    }
  };

  const toggleAFK = (id: string) => {
    setAfkPlayers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-6 border-emerald-100 bg-emerald-50/20">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] sm:text-sm font-bold text-emerald-800 uppercase">Cancha en Vivo</h2>
            {isBasicMode && (
              <span className="bg-amber-100 text-amber-700 text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-amber-200">
                LOCAL
              </span>
            )}
          </div>
          {matchActive && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setShowAdvanced(true)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Opciones Avanzadas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {!startTime && (
                <button 
                  onClick={startTimer}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[9px] sm:text-[10px] font-bold shadow-sm hover:bg-emerald-700 animate-pulse uppercase"
                >
                  ▶ Iniciar
                </button>
              )}
              <div className="flex items-center gap-1">
                {startTime && (
                  <button 
                    onClick={togglePause}
                    className={`p-1.5 rounded-lg transition-colors shadow-sm border ${
                      isPaused 
                        ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={isPaused ? "Reanudar" : "Pausar"}
                  >
                    {isPaused ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}

                  <MatchTimer 
                  startTime={startTime} 
                  accumulatedTime={accumulatedTime}
                  isPaused={isPaused}
                  getEffectiveElapsed={getEffectiveElapsed}
                  sets={sets} 
                  currentSetStartTime={currentSetStartTime}
                  isWaitingForNextSet={isWaitingForNextSet}
                  useSuddenDeath={matchConfig?.useSuddenDeath} 
                  setDuration={matchConfig?.setDuration}
                  matchDuration={matchConfig?.matchDuration}
                  audioConfig={matchConfig}
                />
                {startTime && (
                  <button 
                    onClick={handleEditTimer}
                    className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeline de Sets */}
        <div className="flex flex-col items-center gap-1.5 mb-4 sm:mb-6">
          <div className="flex flex-wrap justify-center gap-1 min-h-[20px]">
            {sets.map((set, idx) => (
              <div 
                key={idx}
                className={`group relative w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 ${
                  set.winner === 'local' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              >
                {idx + 1}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {formatTime(set.time)}
                </div>
              </div>
            ))}
            {sets.length === 0 && (
              <span className="text-[9px] text-slate-400 italic">Esperando sets...</span>
            )}
          </div>
          {sets.length > 0 && matchActive && (
            <button 
              onClick={removeLastSet}
              disabled={busy}
              className="text-[9px] text-slate-400 hover:text-red-500 underline transition-colors disabled:opacity-50 font-medium"
            >
              Deshacer último set
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-0 sm:gap-4 justify-center py-3 sm:py-4 bg-white/40 rounded-lg mb-2">
          {/* Rojo Team */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-red-600 tracking-tighter leading-none">ROJO</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => adjustScore('local', -1)} 
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 text-xs sm:text-base"
                disabled={!matchActive || busy}
              >
                -
              </button>
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-4xl font-black rounded-lg bg-white border shadow-sm text-slate-900 tabular-nums">
                {score.local}
              </div>
              <button 
                onClick={() => addSet('local')} 
                className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 active:scale-90 transition-all font-bold text-xl sm:text-2xl"
                disabled={!matchActive || busy}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 px-1 sm:px-4">
             {matchActive && (isPaused || isWaitingForNextSet) && startTime ? (
                <div className="flex flex-col items-center gap-0.5 animate-in zoom-in duration-300">
                  <button 
                    onClick={isWaitingForNextSet ? startNextSet : togglePause}
                    className="group relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter text-center leading-none">
                    {isWaitingForNextSet ? 'Set' : 'Play'}
                  </span>
                </div>
             ) : (
                <span className="text-xs sm:text-2xl font-bold text-slate-300">VS</span>
             )}
          </div>

          {/* Azul Team */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-blue-600 tracking-tighter leading-none">AZUL</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => addSet('visitante')} 
                className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-90 transition-all font-bold text-xl sm:text-2xl"
                disabled={!matchActive || busy}
              >
                +
              </button>
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-4xl font-black rounded-lg bg-white border shadow-sm text-slate-900 tabular-nums">
                {score.visitante}
              </div>
              <button 
                onClick={() => adjustScore('visitante', -1)} 
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 text-xs sm:text-base"
                disabled={!matchActive || busy}
              >
                -
              </button>
            </div>
          </div>
        </div>

        {matchActive && (rojoIds.length > 0 || azulIds.length > 0) && (
          <RankedAFKSection 
            rojoIds={rojoIds}
            azulIds={azulIds}
            afkPlayers={afkPlayers}
            onToggleAFK={toggleAFK}
            nameById={nameById}
          />
        )}

        <Button 
          className="mt-4 sm:mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 font-bold uppercase tracking-wide shadow-lg shadow-emerald-200 text-[11px] sm:text-xs"
          onClick={() => onFinalize(afkPlayers)} 
          disabled={busy || !matchActive}
        >
          Finalizar Match
        </Button>
      </Card>

      <RankedLeaderboard 
        board={board}
        lbScope={lbScope}
        setLbScope={setLbScope}
        onRefreshLeaderboard={onRefreshLeaderboard}
        busy={busy}
        competenciaId={competenciaId}
        modalidad={modalidad}
        categoria={categoria}
        seasonId={seasonId}
        seasonName={seasonName}
      />

      <RankedMatchSettingsModal 
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        matchId={matchId}
        matchConfig={matchConfig}
        onUpdateConfig={onUpdateConfig}
      />
    </div>
  );
};


