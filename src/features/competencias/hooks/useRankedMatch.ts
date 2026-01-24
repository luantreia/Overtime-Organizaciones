import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthContext';
import { 
  createRankedMatch, 
  autoAssign as apiAutoAssign, 
  assignTeams as apiAssignTeams, 
  finalizeMatch as apiFinalizeMatch, 
  startMatchTimer as apiStartMatchTimer,
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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [matchConfig, setMatchConfig] = useState<{ matchDuration: number; setDuration: number; suddenDeathLimit: number }>({
    matchDuration: 1200,
    setDuration: 180,
    suddenDeathLimit: 180
  });
  const [pjMarked, setPjMarked] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  const persistenceKey = useMemo(() => `rankedMatch:${competenciaId}`, [competenciaId]);

  const syncWithServer = useCallback(async (id: string) => {
    try {
      const { partido, sets: serverSets } = await apiGetRankedMatch(id);
      
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

      // Update start time
      if (partido.rankedMeta?.startTime) {
        setStartTime(new Date(partido.rankedMeta.startTime).getTime());
      }
      
      if (partido.rankedMeta) {
        setMatchConfig({
          matchDuration: partido.rankedMeta.matchDuration || 1200,
          setDuration: partido.rankedMeta.setDuration || 180,
          suddenDeathLimit: partido.rankedMeta.suddenDeathLimit || 180
        });
      }
    } catch (e) {
      console.error('Error in syncWithServer:', e);
    }
  }, []);

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

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistenceKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMatchId(parsed.matchId || null);
        setRojo(parsed.rojo || []);
        setAzul(parsed.azul || []);
        setScore(parsed.score || { local: 0, visitante: 0 });
        setSets(parsed.sets || []);
        setStartTime(parsed.startTime || null);
        setMatchConfig(parsed.matchConfig || { matchDuration: 1200, setDuration: 180, suddenDeathLimit: 180 });
        setPjMarked(!!parsed.pjMarked);
      }
    } catch { }
  }, [persistenceKey]);

  // Save to localStorage
  useEffect(() => {
    if (!competenciaId) return;
    localStorage.setItem(persistenceKey, JSON.stringify({ matchId, rojo, azul, score, sets, startTime, matchConfig, pjMarked }));
  }, [matchId, rojo, azul, score, sets, startTime, matchConfig, pjMarked, persistenceKey, competenciaId]);

  const resetMatchState = useCallback(() => {
    setMatchId(null);
    setRojo([]);
    setAzul([]);
    setScore({ local: 0, visitante: 0 });
    setSets([]);
    setStartTime(null);
    setPjMarked(false);
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey]);

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
    setBusy(true);
    try {
      const currentPlayers = [...rojo, ...azul];
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
  };

  const startTimer = () => {
    if (!matchId) return;
    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      // Sync with backend so Mesa de Control can pick it up
      apiStartMatchTimer(matchId, now).catch(console.error);
    }
  };

  const adjustScore = async (team: 'local' | 'visitante', delta: number) => {
    if (!matchId) {
      setScore(prev => ({
        ...prev,
        [team]: Math.max(0, prev[team] + delta)
      }));
      return;
    }

    setBusy(true);
    try {
      const newScore = { ...score };
      newScore[team] = Math.max(0, newScore[team] + delta);
      
      const res = await apiUpdateScore(matchId, newScore.local, newScore.visitante);
      if (res.ok) {
        setScore(newScore);
      }
    } catch (e) {
      console.error('Error updating score:', e);
    } finally {
      setBusy(false);
    }
  };

  const addSet = async (winner: 'local' | 'visitante') => {
    if (!matchId || busy) return;
    const elapsed = startTime ? Date.now() - startTime : 0;
    const lastSetTime = sets.length > 0 ? sets[sets.length - 1].time : 0;
    const currentSetDuration = elapsed - lastSetTime;
    
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
          await syncWithServer(matchId);
          return;
        }
        throw e;
      }
      
      // 2. Finish it immediately
      await apiFinishSet(newSetDoc._id, winner, Math.floor(currentSetDuration / 1000));

      setSets(prev => [...prev, { _id: newSetDoc._id, winner, time: elapsed }]);
      setScore(prev => ({
        ...prev,
        [winner]: prev[winner] + 1
      }));
      
      // Optional: Sync again to be sure
      await syncWithServer(matchId);
    } catch (e: any) {
      console.error('Error adding set:', e);
      if (e.message?.includes('ya cuenta con el set')) {
        await syncWithServer(matchId);
      } else {
        onError?.(e.message || 'Error al guardar set en servidor');
      }
    } finally {
      setBusy(false);
    }
  };

  const removeLastSet = async () => {
    if (sets.length === 0 || busy) return;
    const last = sets[sets.length - 1];
    
    if (last._id) {
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
      // Local only fallback (shouldn't happen with new logic)
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
    onCreateMatch,
    onAutoAssign,
    onSaveAssignment,
    onFinalizeMatch,
    onCancelMatch,
    abandonMatch,
    adjustScore,
    loadMatch,
    startTime,
    startTimer,
    matchConfig,
    onUpdateConfig: async (newConfig: Partial<{ matchDuration: number; setDuration: number; suddenDeathLimit: number }>) => {
      if (!matchId) return;
      try {
        const res = await apiUpdateMatchConfig(matchId, newConfig);
        setMatchConfig(prev => ({
          ...prev,
          matchDuration: res.rankedMeta.matchDuration ?? prev.matchDuration,
          setDuration: res.rankedMeta.setDuration ?? prev.setDuration,
          suddenDeathLimit: res.rankedMeta.suddenDeathLimit ?? prev.suddenDeathLimit
        }));
        onSuccess?.('Configuración actualizada');
      } catch (e: any) {
        onError?.(e.message || 'Error actualizando configuración');
      }
    }
  };
}
