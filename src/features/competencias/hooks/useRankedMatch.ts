import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthContext';
import { 
  createRankedMatch, 
  autoAssign as apiAutoAssign, 
  assignTeams as apiAssignTeams, 
  finalizeMatch as apiFinalizeMatch, 
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
  incrementPlayedCount: (playerIds: Set<string> | string[]) => void;
  decrementPlayedCount: (playerIds: Set<string> | string[]) => void;
}

export function useRankedMatch({
  competenciaId,
  modalidad,
  categoria,
  temporadaId,
  onSuccess,
  onError,
  onFinalized,
  incrementPlayedCount,
  decrementPlayedCount,
}: UseRankedMatchProps) {
  const { user } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [rojo, setRojo] = useState<string[]>([]);
  const [azul, setAzul] = useState<string[]>([]);
  const [score, setScore] = useState({ local: 0, visitante: 0 });
  const [sets, setSets] = useState<{ winner: 'local' | 'visitante'; time: number }[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const persistenceKey = useMemo(() => `rankedMatch:${competenciaId}`, [competenciaId]);

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
      }
    } catch { }
  }, [persistenceKey]);

  // Save to localStorage
  useEffect(() => {
    if (!competenciaId) return;
    localStorage.setItem(persistenceKey, JSON.stringify({ matchId, rojo, azul, score, sets, startTime }));
  }, [matchId, rojo, azul, score, sets, startTime, persistenceKey, competenciaId]);

  const resetMatchState = useCallback(() => {
    setMatchId(null);
    setRojo([]);
    setAzul([]);
    setScore({ local: 0, visitante: 0 });
    setSets([]);
    setStartTime(null);
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey]);

  const onCreateMatch = async () => {
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
    if (!matchId) return;
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
    if (!matchId) return;
    setBusy(true);
    try {
      await apiAssignTeams(matchId, rojo, azul);
      
      // Increment PJ only the first time assignment is saved (match start)
      if (!startTime) {
        const playedNow = new Set<string>([...rojo, ...azul]);
        incrementPlayedCount(playedNow);
        setStartTime(Date.now());
      }
      
      onSuccess?.('Asignación de equipos guardada');
    } catch (e: any) {
      onError?.(e.message || 'Error guardando equipos');
    } finally {
      setBusy(false);
    }
  };

  const onFinalizeMatch = async (afkIds?: string[]) => {
    if (!matchId) return;
    setBusy(true);
    try {
      await apiFinalizeMatch(matchId, score.local, score.visitante, sets, afkIds, user?.id || 'org-ui');
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
    if (!matchId) return;
    setBusy(true);
    try {
      await deleteRankedMatch(matchId);
      
      // Only revert if teams were already confirmed (timer started)
      if (startTime) {
        const playersToRevert = new Set<string>([...rojo, ...azul]);
        if (playersToRevert.size > 0) {
          decrementPlayedCount(playersToRevert);
        }
      }

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
    markAsPresent?: (ids: string[]) => void
  ) => {
    setMatchId(id);
    setRojo(rojoIds);
    setAzul(azulIds);
    setScore(currentScore);
    setSets(existingSets);
    setStartTime(null); // Timer doesn't make sense for old matches
    
    // Ensure players are marked present when loading a match
    if (markAsPresent) {
      markAsPresent([...rojoIds, ...azulIds]);
    }
  };

  const adjustScore = (team: 'local' | 'visitante', delta: number) => {
    setScore(prev => ({
      ...prev,
      [team]: Math.max(0, prev[team] + delta)
    }));
  };

  const addSet = (winner: 'local' | 'visitante') => {
    const elapsed = startTime ? Date.now() - startTime : 0;
    setSets(prev => [...prev, { winner, time: elapsed }]);
    setScore(prev => ({
      ...prev,
      [winner]: prev[winner] + 1
    }));
  };

  const removeLastSet = () => {
    setSets(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setScore(s => ({
        ...s,
        [last.winner]: Math.max(0, s[last.winner] - 1)
      }));
      return prev.slice(0, -1);
    });
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
    startTime
  };
}
