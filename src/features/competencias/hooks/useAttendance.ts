import { useState, useEffect, useMemo, useCallback } from 'react';

export function useAttendance(competenciaId: string) {
  const [presentes, setPresentes] = useState<string[]>([]);
  const [matchParticipations, setMatchParticipations] = useState<Record<string, string[]>>({});

  const sessionKey = useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `rankedSessionV2:${competenciaId}:${iso}`;
  }, [competenciaId]);

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPresentes(Array.isArray(parsed.presentes) ? parsed.presentes : []);
        setMatchParticipations(parsed.matchParticipations || {});
      } else {
        setPresentes([]);
        setMatchParticipations({});
      }
    } catch {
      setPresentes([]);
      setMatchParticipations({});
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!competenciaId) return;
    try {
      localStorage.setItem(sessionKey, JSON.stringify({ presentes, matchParticipations }));
    } catch (e) {
      console.error('Error saving attendance to localStorage', e);
    }
  }, [sessionKey, presentes, matchParticipations, competenciaId]);

  const togglePresente = useCallback((id: string, isPresent: boolean) => {
    setPresentes((prev) => 
      isPresent 
        ? [...new Set([...prev, id])] 
        : prev.filter((x) => x !== id)
    );
  }, []);

  const syncMatchAttendance = useCallback((matchId: string, playerIds: string[]) => {
    if (!matchId) return;
    setMatchParticipations((prev) => ({
      ...prev,
      [matchId]: [...new Set(playerIds)]
    }));
  }, []);

  const removeMatchAttendance = useCallback((matchId: string) => {
    if (!matchId) return;
    setMatchParticipations((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  }, []);

  const resetPlayedCounts = useCallback(() => setMatchParticipations({}), []);
  const clearPresentes = useCallback(() => setPresentes([]), []);
  const markAllPresent = useCallback((playerIds: string[]) => setPresentes(playerIds), []);

  return {
    presentes,
    setPresentes,
    playedCounts,
    syncMatchAttendance,
    removeMatchAttendance,
    resetPlayedCounts,
    clearPresentes,
    markAllPresent
  };
}
