import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_MATCH_CONFIG } from './constants';

interface MatchTimerProps {
  startTime: number | null;
  accumulatedTime?: number;
  isPaused?: boolean;
  getEffectiveElapsed?: () => number;
  sets?: { winner: string; time: number }[];
  useSuddenDeath?: boolean;
  setDuration?: number;
  matchDuration?: number;
  currentSetStartTime?: number;
  isWaitingForNextSet?: boolean;
  audioConfig?: {
    enableCountdown?: boolean;
    enableWhistle?: boolean;
    whistleType?: 'standard' | 'double' | 'long';
    suddenDeathMessage?: string;
    matchEndMessage?: string;
    enableMatchStartAlert?: boolean;
    matchStartMessage?: string;
    enableLastMinuteAlert?: boolean;
    voiceVolume?: number;
    buzzerVolume?: number;
    voiceRate?: number;
    voiceIndex?: number;
  };
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ 
  startTime, 
  accumulatedTime = 0,
  isPaused = true,
  getEffectiveElapsed,
  sets = [], 
  useSuddenDeath = DEFAULT_MATCH_CONFIG.useSuddenDeath,
  setDuration = DEFAULT_MATCH_CONFIG.setDuration,
  matchDuration = DEFAULT_MATCH_CONFIG.matchDuration,
  currentSetStartTime = 0,
  isWaitingForNextSet = false,
  audioConfig = DEFAULT_MATCH_CONFIG
}) => {
  const [elapsed, setElapsed] = useState<number>(accumulatedTime / 1000);
  const [hasSounded, setHasSounded] = useState<boolean>(false);
  const lastAnnouncedSecond = useRef<number>(-1);
  const hasAnnouncedStart = useRef<boolean>(false);
  const hasAnnouncedLastMinute = useRef<boolean>(false);

  // Audio for the buzzer
  const playBuzzer = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Professional Buzzer Sound
      audio.volume = audioConfig.buzzerVolume ?? 0.5;
      audio.play();
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }, [audioConfig.buzzerVolume]);

  // Audio for the whistle
  const playWhistle = useCallback(() => {
    if (!audioConfig.enableWhistle) return;
    try {
      const sounds = {
        standard: 'https://assets.mixkit.co/active_storage/sfx/2158/2158-preview.mp3',
        double: 'https://assets.mixkit.co/active_storage/sfx/2157/2157-preview.mp3',
        long: 'https://assets.mixkit.co/active_storage/sfx/2159/2159-preview.mp3'
      };
      const audio = new Audio(sounds[audioConfig.whistleType || 'standard']);
      audio.volume = (audioConfig.buzzerVolume ?? 0.5) * 1.2;
      audio.play();
    } catch (e) {
      console.warn('Whistle audio failed', e);
    }
  }, [audioConfig.enableWhistle, audioConfig.buzzerVolume, audioConfig.whistleType]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.volume = audioConfig.voiceVolume ?? 1;
      utterance.rate = audioConfig.voiceRate ?? 1.3;

      const voices = window.speechSynthesis.getVoices();
      if (audioConfig.voiceIndex !== undefined && voices[audioConfig.voiceIndex]) {
        utterance.voice = voices[audioConfig.voiceIndex];
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [audioConfig.voiceVolume, audioConfig.voiceRate, audioConfig.voiceIndex]);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      setHasSounded(false);
      lastAnnouncedSecond.current = -1;
      hasAnnouncedStart.current = false;
      hasAnnouncedLastMinute.current = false;
      return;
    }

    if (isPaused) {
       // If paused, we just set the static elapsed time
       const totalMs = getEffectiveElapsed ? getEffectiveElapsed() : accumulatedTime;
       setElapsed(Math.floor(totalMs / 1000));
       return;
    }

    // Match Start Alert - Triggers immediately when timer starts
    if (audioConfig.enableMatchStartAlert && !hasAnnouncedStart.current) {
      hasAnnouncedStart.current = true;
      speak(audioConfig.matchStartMessage || "¡Partido iniciado!");
    }

    const interval = setInterval(() => {
      const totalMs = getEffectiveElapsed ? getEffectiveElapsed() : (Date.now() - (startTime || 0));
      const currentElapsed = Math.floor(totalMs / 1000);
      setElapsed(currentElapsed);

      // Check for sound trigger (when set time hits limit)
      const currentSetElapsed = currentElapsed - Math.floor(currentSetStartTime / 1000);
      const isUnlimitedSet = !setDuration || setDuration === 0;
      const triggerTime = isUnlimitedSet ? matchDuration : setDuration;
      const checkVal = isUnlimitedSet ? currentElapsed : currentSetElapsed;
      
      const remainingSeconds = triggerTime - checkVal;
      const globalRemainingSeconds = matchDuration - currentElapsed;

      // Last Minute Alert (60s)
      if (audioConfig.enableLastMinuteAlert && globalRemainingSeconds === 60 && !hasAnnouncedLastMinute.current) {
        hasAnnouncedLastMinute.current = true;
        speak("¡Último minuto del partido!");
      }

      // 10s Countdown logic
      if (audioConfig.enableCountdown && remainingSeconds > 0 && remainingSeconds <= 10 && lastAnnouncedSecond.current !== remainingSeconds) {
        lastAnnouncedSecond.current = remainingSeconds;
        speak(String(remainingSeconds));
      }

      // Final trigger at 0
      if (remainingSeconds === 0 && lastAnnouncedSecond.current !== 0) {
        lastAnnouncedSecond.current = 0;
        playWhistle();
        playBuzzer();
        
        // Voice alert logic
        if (useSuddenDeath) {
          // If Sudden Death is active, it always takes priority when time hits 0
          speak(audioConfig.suddenDeathMessage || "¡Muerte Súbita!");
        } else if (globalRemainingSeconds <= 0) {
          // If not SD, Match End message only for Global End
          speak(audioConfig.matchEndMessage || "Tiempo cumplido.");
        } else if (!isUnlimitedSet) {
          // Regular set end without Sudden Death
          speak("Fin del set.");
        }
      }
      
      if (useSuddenDeath && checkVal >= triggerTime && !hasSounded) {
        setHasSounded(true);
      } else if (!useSuddenDeath || checkVal < triggerTime) {
        setHasSounded(false);
        // Reset ref if we move back (e.g. edit clock)
        if (remainingSeconds > 10) lastAnnouncedSecond.current = -1;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, accumulatedTime, isPaused, getEffectiveElapsed, sets, useSuddenDeath, setDuration, matchDuration, currentSetStartTime, hasSounded, audioConfig, playBuzzer, playWhistle, speak]);

  if (!startTime) return null;

  const totalMin = Math.floor(elapsed / 60);
  const totalSec = elapsed % 60;

  // Set Timer calculation
  const isUnlimitedSet = !setDuration || setDuration === 0;
  const currentSetElapsed = isWaitingForNextSet 
    ? 0 
    : Math.max(0, elapsed - Math.floor(currentSetStartTime / 1000));

  // Determine if in Sudden Death
  const triggerTime = isUnlimitedSet ? matchDuration : setDuration;
  const isSuddenDeath = useSuddenDeath && (
    isUnlimitedSet 
      ? elapsed >= triggerTime 
      : currentSetElapsed >= triggerTime
  );

  // Display logic
  let displaySeconds = 0;
  if (isSuddenDeath) {
    displaySeconds = isUnlimitedSet 
      ? (elapsed - triggerTime) 
      : (currentSetElapsed - triggerTime);
  } else {
    displaySeconds = isUnlimitedSet 
      ? currentSetElapsed 
      : Math.max(0, setDuration - currentSetElapsed);
  }

  const setMin = Math.floor(displaySeconds / 60);
  const setSec = displaySeconds % 60;

  return (
    <div className="flex items-center gap-2">
      {/* Set Timer */}
      <div className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg border font-mono shadow-sm transition-colors min-w-[50px] sm:min-w-[60px] ${
        isSuddenDeath ? 'bg-amber-500 border-amber-600 text-white animate-pulse' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <span className={`text-[7px] sm:text-[8px] uppercase tracking-tighter font-black leading-none mb-0.5 ${isSuddenDeath ? 'text-white' : 'text-slate-400'}`}>
          {isSuddenDeath ? 'SÚBITA' : isUnlimitedSet ? 'TIEMPO' : `SET ${sets.length + 1}`}
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
