import { useState, useEffect, useMemo, useCallback } from 'react';

function todayIso(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function sessionKeyFor(competenciaId: string): string {
  return `rankedSessionV2:${competenciaId}:${todayIso()}`;
}

// Lee los presentes de HOY para cualquier competencia, sin necesidad de montar su hook.
// Sirve para copiar la asistencia entre competencias que se juegan en simultáneo.
export function readPresentesForCompetencia(competenciaId: string): string[] {
  if (!competenciaId) return [];
  try {
    const raw = localStorage.getItem(sessionKeyFor(competenciaId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.presentes) ? parsed.presentes : [];
  } catch {
    return [];
  }
}

export function useAttendance(competenciaId: string) {
  const [presentes, setPresentes] = useState<string[]>([]);
  const [matchParticipations, setMatchParticipations] = useState<Record<string, string[]>>({});
  const [matchTimeline, setMatchTimeline] = useState<string[]>([]); // Orden de finalización de partidos

  const sessionKey = useMemo(() => sessionKeyFor(competenciaId), [competenciaId]);

  // Derived playedCounts for backward compatibility and UI
  const playedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(matchParticipations).forEach((playerIds) => {
      playerIds.forEach(pid => {
        counts[pid] = (counts[pid] || 0) + 1;
      });
    });
    return counts;
  }, [matchParticipations]);

  // Devuelve en qué posición del timeline jugó por última vez cada jugador
  const lastMatchPlayedIndex = useMemo(() => {
    const lastIndices: Record<string, number> = {};
    matchTimeline.forEach((matchId, index) => {
      const players = matchParticipations[matchId] || [];
      players.forEach(pid => {
        lastIndices[pid] = index + 1; // 1-based index
      });
    });
    return lastIndices;
  }, [matchTimeline, matchParticipations]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPresentes(Array.isArray(parsed.presentes) ? parsed.presentes : []);
        setMatchParticipations(parsed.matchParticipations || {});
        setMatchTimeline(parsed.matchTimeline || []);
      } else {
        setPresentes([]);
        setMatchParticipations({});
        setMatchTimeline([]);
      }
    } catch {
      setPresentes([]);
      setMatchParticipations({});
      setMatchTimeline([]);
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!competenciaId) return;
    try {
      localStorage.setItem(sessionKey, JSON.stringify({ 
        presentes, 
        matchParticipations,
        matchTimeline 
      }));
    } catch (e) {
      console.error('Error saving attendance to localStorage', e);
    }
  }, [sessionKey, presentes, matchParticipations, matchTimeline, competenciaId]);

  const togglePresente = useCallback((id: string, isPresent: boolean) => {
    setPresentes((prev) => 
      isPresent 
        ? [...new Set([...prev, id])] 
        : prev.filter((x) => x !== id)
    );
  }, []);

  const addManyPresentes = useCallback((ids: string[]) => {
    setPresentes((prev) => [...new Set([...prev, ...ids])]);
  }, []);

  const syncMatchAttendance = useCallback((matchId: string, playerIds: string[]) => {
    if (!matchId) return;
    setMatchParticipations((prev) => ({
      ...prev,
      [matchId]: [...new Set(playerIds)]
    }));
    setMatchTimeline(prev => {
      if (prev.includes(matchId)) return prev;
      return [...prev, matchId];
    });
  }, []);

  const removeMatchAttendance = useCallback((matchId: string) => {
    if (!matchId) return;
    setMatchParticipations((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    setMatchTimeline(prev => prev.filter(id => id !== matchId));
  }, []);

  const resetPlayedCounts = useCallback(() => {
    setMatchParticipations({});
    setMatchTimeline([]);
  }, []);

  const clearPresentes = useCallback(() => setPresentes([]), []);
  const markAllPresent = useCallback((playerIds: string[]) => setPresentes(playerIds), []);

  return {
    presentes,
    setPresentes,
    togglePresente,
    addManyPresentes,
    playedCounts,
    lastMatchPlayedIndex,
    matchTimelineLength: matchTimeline.length,
    syncMatchAttendance,
    removeMatchAttendance,
    resetPlayedCounts,
    clearPresentes,
    markAllPresent
  };
}
