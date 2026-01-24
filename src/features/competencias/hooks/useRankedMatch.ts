import { useState } from 'react';
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
}

export function useRankedMatch({
  competenciaId,
  modalidad,
  categoria,
  temporadaId,
  onSuccess,
  onError,
  onFinalized,
  incrementPlayedCount
}: UseRankedMatchProps) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [rojo, setRojo] = useState<string[]>([]);
  const [azul, setAzul] = useState<string[]>([]);
  const [score, setScore] = useState({ local: 0, visitante: 0 });
  const [busy, setBusy] = useState(false);

  const resetMatchState = () => {
    setMatchId(null);
    setRojo([]);
    setAzul([]);
    setScore({ local: 0, visitante: 0 });
  };

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
        creadoPor: 'org-ui',
        competenciaId,
        temporadaId: temporadaId || undefined
      });
      setMatchId(r.partidoId);
      setRojo([]);
      setAzul([]);
      onSuccess?.('Partido ranked creado con éxito');
    } catch (e: any) {
      onError?.(e.message || 'Error creando partido');
    } finally {
      setBusy(false);
    }
  };

  const onAutoAssign = async (selectedPlayers: string[]) => {
    if (!matchId) return;
    setBusy(true);
    try {
      const r = await apiAutoAssign(matchId, selectedPlayers, true);
      setRojo(r.rojoPlayers);
      setAzul(r.azulPlayers);
      onSuccess?.('Equipos auto-asignados');
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
      const playedNow = new Set<string>([...rojo, ...azul]);
      incrementPlayedCount(playedNow);
      onSuccess?.('Asignación de equipos guardada');
    } catch (e: any) {
      onError?.(e.message || 'Error guardando equipos');
    } finally {
      setBusy(false);
    }
  };

  const onFinalizeMatch = async () => {
    if (!matchId) return;
    setBusy(true);
    try {
      // Como respaldo, marcar PJ hoy si no se hizo al guardar
      const playedNow = new Set<string>([...rojo, ...azul]);
      incrementPlayedCount(playedNow);
      
      await apiFinalizeMatch(matchId, score.local, score.visitante);
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
      resetMatchState();
      onSuccess?.('Partido eliminado');
    } catch (e: any) {
      onError?.(e.message || 'Error eliminando partido');
    } finally {
      setBusy(false);
    }
  };

  const abandonMatch = () => {
    resetMatchState();
  };

  return {
    matchId,
    rojo,
    setRojo,
    azul,
    setAzul,
    score,
    setScore,
    busy,
    onCreateMatch,
    onAutoAssign,
    onSaveAssignment,
    onFinalizeMatch,
    onCancelMatch,
    abandonMatch,
    setMatchId
  };
}
