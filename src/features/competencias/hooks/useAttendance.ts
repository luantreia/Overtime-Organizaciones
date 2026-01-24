import { useState, useEffect, useMemo } from 'react';

export function useAttendance(competenciaId: string) {
  const [presentes, setPresentes] = useState<string[]>([]);
  const [playedCounts, setPlayedCounts] = useState<Record<string, number>>({});

  const sessionKey = useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `rankedSession:${competenciaId}:${iso}`;
  }, [competenciaId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPresentes(Array.isArray(parsed.presentes) ? parsed.presentes : []);
        setPlayedCounts(parsed.playedCounts && typeof parsed.playedCounts === 'object' ? parsed.playedCounts : {});
      } else {
        setPresentes([]);
        setPlayedCounts({});
      }
    } catch {
      setPresentes([]);
      setPlayedCounts({});
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!competenciaId) return;
    try {
      localStorage.setItem(sessionKey, JSON.stringify({ presentes, playedCounts }));
    } catch (e) {
      console.error('Error saving attendance to localStorage', e);
    }
  }, [sessionKey, presentes, playedCounts, competenciaId]);

  const togglePresente = (id: string, isPresent: boolean) => {
    setPresentes((prev) => 
      isPresent 
        ? [...new Set([...prev, id])] 
        : prev.filter((x) => x !== id)
    );
  };

  const incrementPlayedCount = (playerIds: Set<string> | string[]) => {
    setPlayedCounts((prev) => {
      const next = { ...prev };
      playerIds.forEach((id) => {
        next[id] = (next[id] || 0) + 1;
      });
      return next;
    });
  };

  const resetPlayedCounts = () => setPlayedCounts({});
  const clearPresentes = () => setPresentes([]);
  const markAllPresent = (playerIds: string[]) => setPresentes(playerIds);

  return {
    presentes,
    setPresentes,
    playedCounts,
    setPlayedCounts,
    togglePresente,
    incrementPlayedCount,
    resetPlayedCounts,
    clearPresentes,
    markAllPresent
  };
}
