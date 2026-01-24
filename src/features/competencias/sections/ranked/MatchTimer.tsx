import React, { useState, useEffect } from 'react';

interface MatchTimerProps {
  startTime: number | null;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ startTime }) => {
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

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900 text-white font-mono shadow-inner border border-slate-700">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tiempo de Juego</span>
      <span className="text-2xl font-bold">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
