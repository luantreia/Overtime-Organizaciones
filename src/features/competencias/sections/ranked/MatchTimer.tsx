import React, { useState, useEffect } from 'react';

interface MatchTimerProps {
  startTime: number | null;
  sets?: { winner: string; time: number }[];
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ startTime, sets = [] }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const totalMin = Math.floor(elapsed / 60);
  const totalSec = elapsed % 60;

  // Set Timer calculation
  const lastSetTime = sets.length > 0 ? Math.floor(sets[sets.length - 1].time / 1000) : 0;
  const currentSetElapsed = elapsed - lastSetTime;
  const setMin = Math.floor(currentSetElapsed / 60);
  const setSec = currentSetElapsed % 60;
  const isSuddenDeath = setMin >= 3;

  return (
    <div className="flex items-center gap-2">
      {/* Set Timer */}
      <div className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg border font-mono shadow-sm transition-colors ${
        isSuddenDeath ? 'bg-amber-500 border-amber-600 text-white animate-pulse' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <span className={`text-[7px] sm:text-[8px] uppercase tracking-tighter font-black leading-none mb-0.5 ${isSuddenDeath ? 'text-white' : 'text-slate-400'}`}>
          {isSuddenDeath ? 'SÚBITA' : `SET ${sets.length + 1}`}
        </span>
        <span className="text-sm sm:text-base font-black leading-none">
          {String(setMin).padStart(2, '0')}:{String(setSec).padStart(2, '0')}
        </span>
      </div>

      {/* Match Timer */}
      <div className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg bg-slate-900 text-white font-mono shadow-inner border border-slate-700 min-w-[50px] sm:min-w-[60px]">
        <span className="text-[7px] sm:text-[8px] uppercase tracking-tighter text-slate-400 font-bold leading-none mb-0.5">Global</span>
        <span className="text-xs sm:text-sm font-bold leading-none">
          {String(totalMin).padStart(2, '0')}:{String(totalSec).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
