import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthContext';
import { 
  createRankedMatch, 
  autoAssign as apiAutoAssign, 
  assignTeams as apiAssignTeams, 
  finalizeMatch as apiFinalizeMatch, 
  updateMatchConfig as apiUpdateMatchConfig,
  getRankedMatch as apiGetRankedMatch,
  updateScore as apiUpdateScore,
  createSet as apiCreateSet,
  finishSet as apiFinishSet,
  deleteSet as apiDeleteSet,
  deleteRankedMatch,
  Modalidad,
  Categoria
} from '../../ranked/services/rankedService';

interface UseRankedMatchProps {
  competenciaId: string;
  modalidad: Modalidad | '';
  categoria: Categoria | '';
  temporadaId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onFinalized?: () => void;
  syncMatchAttendance: (matchId: string, playerIds: string[]) => void;
  removeMatchAttendance: (matchId: string) => void;
}

export function useRankedMatch({
  competenciaId,
  modalidad,
  categoria,
  temporadaId,
  onSuccess,
  onError,
  onFinalized,
  syncMatchAttendance,
  removeMatchAttendance,
}: UseRankedMatchProps) {
  const { user } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [rojo, setRojo] = useState<string[]>([]);
  const [azul, setAzul] = useState<string[]>([]);
  const [score, setScore] = useState({ local: 0, visitante: 0 });
  const [sets, setSets] = useState<{ _id?: string; winner: 'local' | 'visitante'; time: number }[]>([]);
  
  // Timers State
  const [startTime, rawSetStartTime] = useState<number | null>(null); // Use this as the REFERENCE for MatchTimer legacy, but we'll use more precise ones:
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
  const [lastStartTime, setLastStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Set-specific timer state
  const [currentSetStartTime, setCurrentSetStartTime] = useState<number>(0); // Match time (ms) when current set started
  const [isWaitingForNextSet, setIsWaitingForNextSet] = useState<boolean>(false);
  const isWaitingForNextSetRef = useRef(isWaitingForNextSet);
  useEffect(() => { isWaitingForNextSetRef.current = isWaitingForNextSet; }, [isWaitingForNextSet]);

  // Wrapper to keep timer states in sync
  const setStartTime = useCallback((val: number | null) => {
    rawSetStartTime(val);
    const p = isPausedRef.current;
    if (val === null) {
      setAccumulatedTime(0);
      setLastStartTime(null);
      setCurrentSetStartTime(0);
      setIsWaitingForNextSet(false);
    } else if (val) {
      const totalElapsed = Math.max(0, Date.now() - val);
      if (p) {
        setAccumulatedTime(totalElapsed);
        setLastStartTime(null);
      } else {
        setAccumulatedTime(0);
        setLastStartTime(val);
      }
    }
  }, []); // Stable callback

  const [matchConfig, setMatchConfig] = useState<{ 
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
  }>({
    matchDuration: 1200,
    setDuration: 180,
    useSuddenDeath: true,
    autoPauseGlobal: false,
    enableCountdown: true,
    enableWhistle: true,
    voiceVolume: 1,
    buzzerVolume: 0.5,
    voiceRate: 1.3,
    voiceIndex: 0
  });
  const [pjMarked, setPjMarked] = useState<boolean>(false);
  const [isBasicMode, setIsBasicMode] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const hasLoadedRef = useRef(false);

  const persistenceKey = useMemo(() => `rankedMatch:${competenciaId}`, [competenciaId]);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [persistenceKey]);

  const syncWithServer = useCallback(async (id: string, force = false) => {
    if (isBasicMode && !force) return; // Skip sync in basic mode unless forced
    try {
      const { partido, sets: serverSets } = await apiGetRankedMatch(id);
      
      // Update teams if they are in the response
      if (partido.rojoPlayers || partido.azulPlayers) {
         setRojo((partido.rojoPlayers || []).map((p: any) => typeof p === 'string' ? p : (p._id || p.id)).filter(Boolean));
         setAzul((partido.azulPlayers || []).map((p: any) => typeof p === 'string' ? p : (p._id || p.id)).filter(Boolean));
      } else if (partido.matchTeams) {
         const r = partido.matchTeams.find((t: any) => t.color === 'rojo');
         const a = partido.matchTeams.find((t: any) => t.color === 'azul');
         if (r) setRojo((r.players || []).map((p: any) => typeof p === 'string' ? p : (p._id || p.id)).filter(Boolean));
         if (a) setAzul((a.players || []).map((p: any) => typeof p === 'string' ? p : (p._id || p.id)).filter(Boolean));
      }

      // Update score if matched from server
      if (partido.marcadorLocal !== undefined && partido.marcadorVisitante !== undefined) {
        setScore({ local: partido.marcadorLocal, visitante: partido.marcadorVisitante });
      }

      // Update sets (mapping server structure to hook structure)
      if (serverSets) {
        let cumulative = 0;
        setSets(serverSets.map((s: any) => {
          cumulative += (s.lastSetDuration || 0) * 1000;
          return {
            _id: s._id,
            winner: s.ganadorSet,
            time: cumulative
          };
        }));
      }

      if (partido.rankedMeta) {
        setMatchConfig(prev => ({
          ...prev,
          matchDuration: partido.rankedMeta.matchDuration || 1200,
          setDuration: partido.rankedMeta.setDuration || 180,
          useSuddenDeath: partido.rankedMeta.useSuddenDeath ?? (partido.rankedMeta.suddenDeathLimit > 0),
          autoPauseGlobal: partido.rankedMeta.autoPauseGlobal,
          enableCountdown: partido.rankedMeta.enableCountdown ?? prev.enableCountdown,
          enableWhistle: partido.rankedMeta.enableWhistle ?? prev.enableWhistle,
          voiceVolume: partido.rankedMeta.voiceVolume ?? prev.voiceVolume,
          buzzerVolume: partido.rankedMeta.buzzerVolume ?? prev.buzzerVolume,
          voiceRate: partido.rankedMeta.voiceRate ?? prev.voiceRate,
          voiceIndex: partido.rankedMeta.voiceIndex ?? prev.voiceIndex
        }));
      }
    } catch (e) {
      console.error('Error in syncWithServer:', e);
    }
  }, [isBasicMode]);

  // Polling for Interoperability
  useEffect(() => {
    if (!matchId) return;

    const interval = setInterval(() => {
      // Only sync if not busy with an action
      if (!busy) {
        syncWithServer(matchId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId, busy, syncWithServer]);

  // Load from localStorage (Initialization only)
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    try {
      const raw = localStorage.getItem(persistenceKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        
        // If we found a saved session, hydrate the state
        if (parsed.matchId) {
          setMatchId(parsed.matchId);
          setRojo(parsed.rojo || []);
          setAzul(parsed.azul || []);
          setScore(parsed.score || { local: 0, visitante: 0 });
          setSets(parsed.sets || []);
          
          // Restore timers
          setAccumulatedTime(parsed.accumulatedTime || 0);
          setIsPaused(parsed.isPaused !== undefined ? parsed.isPaused : true);
          setLastStartTime(parsed.lastStartTime || null);
          rawSetStartTime(parsed.startTime || null);
          setCurrentSetStartTime(parsed.currentSetStartTime || 0);
          setIsWaitingForNextSet(!!parsed.isWaitingForNextSet);

          setMatchConfig(parsed.matchConfig || { matchDuration: 1200, setDuration: 180, useSuddenDeath: true });
          setPjMarked(!!parsed.pjMarked);
          setIsBasicMode(!!parsed.isBasicMode);
        }
      }
      hasLoadedRef.current = true;
    } catch { 
      hasLoadedRef.current = true;
    }
  }, [persistenceKey]);

  // Save to localStorage
  useEffect(() => {
    if (!competenciaId) return;
    localStorage.setItem(persistenceKey, JSON.stringify({ 
      matchId, rojo, azul, score, sets, startTime, 
      accumulatedTime, lastStartTime, isPaused,
      currentSetStartTime, isWaitingForNextSet,
      matchConfig, pjMarked, isBasicMode 
    }));
  }, [matchId, rojo, azul, score, sets, startTime, accumulatedTime, lastStartTime, isPaused, currentSetStartTime, isWaitingForNextSet, matchConfig, pjMarked, isBasicMode, persistenceKey, competenciaId]);

  const resetMatchState = useCallback(() => {
    setMatchId(null);
    setRojo([]);
    setAzul([]);
    setScore({ local: 0, visitante: 0 });
    setSets([]);
    setStartTime(null);
    setAccumulatedTime(0);
    setLastStartTime(null);
    setIsPaused(true);
    setPjMarked(false);
    // Note: we keep isBasicMode preference
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey, setStartTime]);

  const onCreateMatch = async () => {
    if (busy) return;
    if (!competenciaId || !modalidad || !categoria) {
      onError?.('Faltan datos de competencia, modalidad o categoría');
      return;
    }
    setBusy(true);
    try {
      const r = await createRankedMatch({
        modalidad: modalidad as Modalidad,
        categoria: categoria as Categoria,
        creadoPor: user?.id || 'org-ui',
        competenciaId,
        temporadaId: temporadaId || undefined
      });
      setMatchId(r.partidoId);
      setRojo([]);
      setAzul([]);
      setScore({ local: 0, visitante: 0 });
      setStartTime(null);
      onSuccess?.('Partido ranked creado con éxito');
    } catch (e: any) {
      onError?.(e.message || 'Error creando partido');
    } finally {
      setBusy(false);
    }
  };

  const onAutoAssign = async (presentes: string[], playedCounts: Record<string, number>) => {
    if (!matchId || busy) return;

    // Logic: If teams already have players, only fill gaps instead of reshuffling everything.
    const hasInitialPlayers = rojo.length > 0 || azul.length > 0;
    if (hasInitialPlayers) {
      const inMatch = new Set([...rojo, ...azul]);
      const available = presentes.filter(pid => !inMatch.has(pid));
      // Prioritize by PJ
      const sorted = [...available].sort((a, b) => (playedCounts[a] || 0) - (playedCounts[b] || 0));

      const maxTeamSize = 9;
      const neededRojo = Math.max(0, maxTeamSize - rojo.length);
      const neededAzul = Math.max(0, maxTeamSize - azul.length);

      if (neededRojo === 0 && neededAzul === 0) {
        onSuccess?.('Los equipos ya están al límite (9v9)');
        return;
      }

      const toAddRojo: string[] = [];
      const toAddAzul: string[] = [];

      // Fill based on current balance
      sorted.forEach((pid) => {
        const currentRojo = rojo.length + toAddRojo.length;
        const currentAzul = azul.length + toAddAzul.length;

        if (currentRojo <= currentAzul) {
          if (toAddRojo.length < neededRojo) {
            toAddRojo.push(pid);
          } else if (toAddAzul.length < neededAzul) {
            toAddAzul.push(pid);
          }
        } else {
          if (toAddAzul.length < neededAzul) {
            toAddAzul.push(pid);
          } else if (toAddRojo.length < neededRojo) {
            toAddRojo.push(pid);
          }
        }
      });

      if (toAddRojo.length > 0 || toAddAzul.length > 0) {
        const nextRojo = [...rojo, ...toAddRojo];
        const nextAzul = [...azul, ...toAddAzul];
        setRojo(nextRojo);
        setAzul(nextAzul);
        setBusy(true);
        try {
          await apiAssignTeams(matchId, nextRojo, nextAzul);
          onSuccess?.(`Equipos rellenados con ${toAddRojo.length + toAddAzul.length} jugadores.`);
        } catch (e: any) {
          onError?.(e.message || 'Error actualizando rellenos');
        } finally {
          setBusy(false);
        }
      } else {
        onSuccess?.('No hay jugadores disponibles para rellenar huecos.');
      }
      return;
    }

    setBusy(true);
    try {
      // Prioritize players with fewer PJ today
      const sortedPool = [...presentes].sort((a, b) => (playedCounts[a] || 0) - (playedCounts[b] || 0));
      const picked = sortedPool.slice(0, 18); // Max 9 vs 9 (Matches backend cap of 18 total)
      
      const r = await apiAutoAssign(matchId, picked, true);
      setRojo(r.rojoPlayers);
      setAzul(r.azulPlayers);
      onSuccess?.('Equipos auto-asignados (Priorizando descanso)');
    } catch (e: any) {
      onError?.(e.message || 'Error auto-asignando');
    } finally {
      setBusy(false);
    }
  };

  const onSaveAssignment = async () => {
    if (!matchId || busy) return;
    setBusy(true);
    try {
      await apiAssignTeams(matchId, rojo, azul);
      
      const currentPlayers = [...rojo, ...azul];
      syncMatchAttendance(matchId, currentPlayers);
      if (currentPlayers.length > 0) setPjMarked(true);

      onSuccess?.('Asignación de equipos guardada');
    } catch (e: any) {
      onError?.(e.message || 'Error guardando equipos');
    } finally {
      setBusy(false);
    }
  };

  const onFinalizeMatch = async (afkIds?: string[]) => {
    if (!matchId || busy) return;
    
    const currentPlayers = [...rojo, ...azul];
    if (currentPlayers.length === 0) {
      onError?.('No puedes finalizar un partido sin jugadores en los equipos');
      return;
    }

    setBusy(true);
    try {
      // Garantizamos que los equipos estén guardados en el servidor antes de finalizar
      // Esto asegura que el backend cuente los PJs correctamente
      if (!isBasicMode) {
        await apiAssignTeams(matchId, rojo, azul);
      }
      
      syncMatchAttendance(matchId, currentPlayers);

      await apiFinalizeMatch(matchId, score.local, score.visitante, sets, afkIds, user?.id || 'org-ui', startTime || undefined);
      onSuccess?.('Partido finalizado con éxito');
      resetMatchState();
      onFinalized?.();
    } catch (e: any) {
      onError?.(e.message || 'Error finalizando partido');
    } finally {
      setBusy(false);
    }
  };

  const onCancelMatch = async () => {
    if (!matchId || busy) return;
    setBusy(true);
    try {
      await deleteRankedMatch(matchId);
      removeMatchAttendance(matchId);
      resetMatchState();
      onSuccess?.('Partido eliminado y estadísticas revertidas');
    } catch (e: any) {
      onError?.(e.message || 'Error eliminando partido');
    } finally {
      setBusy(false);
    }
  };

  const abandonMatch = () => {
    resetMatchState();
  };

  const loadMatch = async (
    id: string, 
    rojoIds: string[], 
    azulIds: string[], 
    currentScore: { local: number; visitante: number }, 
    existingSets: any[] = [],
    markAsPresent?: (ids: string[]) => void,
    externalStartTime?: number
  ) => {
    setBusy(true);
    try {
      setMatchId(id);
      setRojo(rojoIds);
      setAzul(azulIds);
      setScore(currentScore);
      setSets(existingSets);
      setStartTime(externalStartTime || null);
      
      const currentPlayers = [...rojoIds, ...azulIds];
      syncMatchAttendance(id, currentPlayers);
      if (currentPlayers.length > 0) setPjMarked(true);

      // Ensure players are marked present when loading a match
      if (markAsPresent) {
        markAsPresent([...rojoIds, ...azulIds]);
      }

      // Update local storage immediately to prevent race conditions with useEffect
      localStorage.setItem(persistenceKey, JSON.stringify({ 
        matchId: id, rojo: rojoIds, azul: azulIds, score: currentScore, sets: existingSets, 
        startTime: externalStartTime || null, matchConfig, pjMarked: true, isBasicMode,
        currentSetStartTime: 0, isWaitingForNextSet: false 
      }));
    } finally {
      setBusy(false);
    }
  };

  const startTimer = () => {
    if (!matchId) return;
    const now = Date.now();
    if (!startTime) {
      setStartTime(now);
    }
    setLastStartTime(now);
    setIsPaused(false);
  };

  const getEffectiveElapsed = useCallback(() => {
    if (isPaused) return accumulatedTime;
    if (!lastStartTime) return accumulatedTime;
    return accumulatedTime + (Date.now() - lastStartTime);
  }, [isPaused, accumulatedTime, lastStartTime]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume
      setLastStartTime(Date.now());
      setIsPaused(false);
      
      if (isWaitingForNextSetRef.current) {
         const globalTime = getEffectiveElapsed();
         setCurrentSetStartTime(globalTime);
         setIsWaitingForNextSet(false);
      }
    } else {
      // Pause
      if (lastStartTime) {
        const delta = Date.now() - lastStartTime;
        setAccumulatedTime(prev => prev + delta);
      }
      setIsPaused(true);
    }
  }, [isPaused, lastStartTime, getEffectiveElapsed]);

  const startNextSet = useCallback(() => {
    if (isPaused) {
      setLastStartTime(Date.now());
      setIsPaused(false);
    }
    const globalTime = getEffectiveElapsed();
    setCurrentSetStartTime(globalTime);
    setIsWaitingForNextSet(false);
  }, [isPaused, getEffectiveElapsed]);

  const adjustScore = async (team: 'local' | 'visitante', delta: number) => {
    const newScore = { ...score };
    newScore[team] = Math.max(0, newScore[team] + delta);
    setScore(newScore);

    if (!matchId || isBasicMode) {
      return;
    }

    setBusy(true);
    try {
      await apiUpdateScore(matchId, newScore.local, newScore.visitante);
    } catch (e) {
      console.error('Error updating score:', e);
    } finally {
      setBusy(false);
    }
  };

  const addSet = async (winner: 'local' | 'visitante') => {
    if (!matchId) return;
    
    // Calculate final time for this set before pausing
    const elapsed = getEffectiveElapsed();
    const lastSetTime = sets.length > 0 ? sets[sets.length - 1].time : 0;
    const currentSetDurationMs = elapsed - lastSetTime;

    // Automatic Pause (as requested)
    setIsWaitingForNextSet(true);
    if (matchConfig.autoPauseGlobal && !isPaused) {
       togglePause();
    }
    
    // In Basic Mode, we only update local state
    if (isBasicMode) {
      setSets(prev => [...prev, { _id: `temp-${Date.now()}`, winner, time: elapsed }]);
      setScore(prev => ({
        ...prev,
        [winner]: prev[winner] + 1
      }));
      return;
    }

    setBusy(true);
    try {
      // 1. Create set in DB
      const nextSetNum = sets.length + 1;
      let newSetDoc: any;
      try {
        newSetDoc = await apiCreateSet(matchId, nextSetNum);
      } catch (e: any) {
        if (e.message?.includes('ya cuenta con el set')) {
          // If already exists, sync and abort local push
          await syncWithServer(matchId, true);
          return;
        }
        throw e;
      }
      
      // 2. Finish it immediately
      await apiFinishSet(newSetDoc._id, winner, Math.floor(currentSetDurationMs / 1000));

      setSets(prev => [...prev, { _id: newSetDoc._id, winner, time: elapsed }]);
      setScore(prev => ({
        ...prev,
        [winner]: prev[winner] + 1
      }));
      
      // Optional: Sync again to be sure
      await syncWithServer(matchId, true);
    } catch (e: any) {
      console.error('Error adding set:', e);
      if (e.message?.includes('ya cuenta con el set')) {
        await syncWithServer(matchId, true);
      } else {
        onError?.(e.message || 'Error al guardar set en servidor');
      }
    } finally {
      setBusy(false);
    }
  };

  const removeLastSet = async () => {
    if (sets.length === 0) return;
    const last = sets[sets.length - 1];
    
    if (isBasicMode) {
      setSets(prev => prev.slice(0, -1));
      setScore(s => ({
        ...s,
        [last.winner]: Math.max(0, s[last.winner] - 1)
      }));
      return;
    }

    if (last._id && !last._id.startsWith('temp-')) {
      setBusy(true);
      try {
        await apiDeleteSet(last._id);
        setSets(prev => prev.slice(0, -1));
        setScore(s => ({
          ...s,
          [last.winner]: Math.max(0, s[last.winner] - 1)
        }));
      } catch (e: any) {
        onError?.(e.message || 'Error al eliminar set de servidor');
      } finally {
        setBusy(false);
      }
    } else {
      // Local fallback
      setSets(prev => prev.slice(0, -1));
      setScore(s => ({
        ...s,
        [last.winner]: Math.max(0, s[last.winner] - 1)
      }));
    }
  };

  return {
    matchId,
    rojo,
    setRojo,
    azul,
    setAzul,
    score,
    setScore,
    sets,
    addSet,
    removeLastSet,
    busy,
    isBasicMode,
    setIsBasicMode,
    onCreateMatch,
    onAutoAssign,
    onSaveAssignment,
    onFinalizeMatch,
    onCancelMatch,
    abandonMatch,
    adjustScore,
    loadMatch,
    startTime,
    setStartTime,
    isPaused,
    accumulatedTime,
    currentSetStartTime,
    isWaitingForNextSet,
    getEffectiveElapsed,
    togglePause,
    startNextSet,
    startTimer,
    matchConfig,
    onUpdateConfig: async (newConfig: Partial<{ 
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
    }>) => {
      if (!matchId) return;
      if (isBasicMode) {
        setMatchConfig(prev => ({ ...prev, ...newConfig }));
        onSuccess?.('Configuración local actualizada');
        return;
      }
      try {
        const res = await apiUpdateMatchConfig(matchId, newConfig);
        setMatchConfig(prev => ({
          ...prev,
          matchDuration: res.rankedMeta.matchDuration ?? prev.matchDuration,
          setDuration: res.rankedMeta.setDuration ?? prev.setDuration,
          useSuddenDeath: res.rankedMeta.useSuddenDeath ?? prev.useSuddenDeath,
          autoPauseGlobal: res.rankedMeta.autoPauseGlobal ?? prev.autoPauseGlobal,
          enableCountdown: res.rankedMeta.enableCountdown ?? prev.enableCountdown,
          enableWhistle: res.rankedMeta.enableWhistle ?? prev.enableWhistle,
          voiceVolume: res.rankedMeta.voiceVolume ?? prev.voiceVolume,
          buzzerVolume: res.rankedMeta.buzzerVolume ?? prev.buzzerVolume,
          voiceRate: res.rankedMeta.voiceRate ?? prev.voiceRate,
          voiceIndex: res.rankedMeta.voiceIndex ?? prev.voiceIndex
        }));
        onSuccess?.('Configuración actualizada');
      } catch (e: any) {
        onError?.(e.message || 'Error actualizando configuración');
      }
    }
  };
}
