import React, { useState, useEffect } from 'react';

interface MatchTimerProps {
  startTime: number | null;
  sets?: { winner: string; time: number }[];
  suddenDeathLimit?: number;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ startTime, sets = [], suddenDeathLimit = 180 }) => {
  const [elapsed, setElapsed] = useState<number>(0);
  const [hasSounded, setHasSounded] = useState<boolean>(false);

  // Audio for the buzzer
  const playBuzzer = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Professional Buzzer Sound
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      setHasSounded(false);
      return;
    }

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(currentElapsed);

      // Check for sound trigger (when set time hits limit)
      const lastSetTime = sets.length > 0 ? Math.floor(sets[sets.length - 1].time / 1000) : 0;
      const currentSetElapsed = currentElapsed - lastSetTime;
      
      if (suddenDeathLimit > 0 && currentSetElapsed >= suddenDeathLimit && !hasSounded) {
        playBuzzer();
        setHasSounded(true);
      } else if (currentSetElapsed < suddenDeathLimit) {
        // Reset sound flag if we are in a new set or time was edited back
        setHasSounded(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, sets, suddenDeathLimit, hasSounded]);

  if (!startTime) return null;

  const totalMin = Math.floor(elapsed / 60);
  const totalSec = elapsed % 60;

  // Set Timer calculation
  const lastSetTime = sets.length > 0 ? Math.floor(sets[sets.length - 1].time / 1000) : 0;
  const currentSetElapsed = elapsed - lastSetTime;

  // Countdown logic: suddenDeathLimit is the starting point
  const setRemaining = suddenDeathLimit - currentSetElapsed;
  const isSuddenDeath = suddenDeathLimit > 0 && setRemaining <= 0;

  // Display: count down till zero, then count up for sudden death
  const displaySeconds = isSuddenDeath 
    ? Math.abs(setRemaining) 
    : Math.max(0, setRemaining);

  const setMin = Math.floor(displaySeconds / 60);
  const setSec = displaySeconds % 60;

  return (
    <div className="flex items-center gap-2">
      {/* Set Timer */}
      <div className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg border font-mono shadow-sm transition-colors min-w-[50px] sm:min-w-[60px] ${
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
