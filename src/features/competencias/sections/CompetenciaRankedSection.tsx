import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getLeaderboard,
  markMatchAsRanked,
  getRankedMatch as getLeaderboardMatch,
  listJugadores,
  crearJugador,
  revertMatch,
  resetAllRankings,
  resetScopeRankings,
  recalculateGlobalRankings,
  recalculateScopeRankings,
  syncAllWins,
  cleanupGhostPlayers,
  getRooms,
  assignMatchToRoom,
  updateMatchLocation,
  deleteRankedMatch,
  type BroadcastRoom
} from '../../ranked/services/rankedService';
import { SedeService, type Sede } from '../../sedes/services/sedeService';
import {
  crearJugadorCompetencia,
  listJugadoresCompetencia,
  eliminarJugadorCompetencia
} from '../../jugadores/services/jugadorCompetenciaService';
import { getPartidosPorCompetencia, getPartidosPorTemporada } from '../../partidos/services/partidoService';
import { listTemporadasByCompetencia, type BackendTemporada } from '../services';
import { listCompetenciasByOrganizacion, type BackendCompetencia } from '../services/competenciasService';

// Hooks
import { useAttendance, readPresentesForCompetencia } from '../hooks/useAttendance';
import { useRankedMatch } from '../hooks/useRankedMatch';

// Components
import { RankedPlayerSelector } from './ranked/RankedPlayerSelector';
import { TeamBuilder } from './ranked/TeamBuilder';
import { RankedScoreboard } from './ranked/RankedScoreboard';
import { RankedLeaderboard } from './ranked/RankedLeaderboard';
import { RankedAdminTools } from './ranked/RankedAdminTools';

// Shared UI
import { Button } from '../../../shared/components/ui';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

// Rango Unicode de diacríticos combinables (U+0300-U+036F), construido por code point
// para no depender de caracteres literales no-ASCII en el código fuente.
const COMBINING_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
);

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type RankedTab = 'presentes' | 'equipos' | 'ranking' | 'mas';

export default function CompetenciaRankedSection({
  competenciaId,
  modalidad,
  categoria,
  organizacionId,
}: {
  competenciaId: string;
  modalidad: 'Foam' | 'Cloth' | '';
  categoria: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '';
  organizacionId?: string;
}) {
  const [players, setPlayers] = useState<Array<{ _id: string; nombre: string; jcId?: string }>>([]);
  const [compPlayers, setCompPlayers] = useState<Array<{ _id: string; nombre: string; jcId?: string }>>([]);
  const [allPlayers, setAllPlayers] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [board, setBoard] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);

  // Navegación mobile-first: una sola pestaña de contenido a la vez,
  // debajo de un marcador que se queda fijo mientras hay partido en curso.
  const [activeTab, setActiveTab] = useState<RankedTab>('presentes');
  const [configOpen, setConfigOpen] = useState(false);
  const [matchBarOpen, setMatchBarOpen] = useState(false);
  const [afkPlayers, setAfkPlayers] = useState<string[]>([]);
  const toggleAFK = (id: string) => {
    setAfkPlayers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Auto-dismiss notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [convertId, setConvertId] = useState<string>('');
  const [revertId, setRevertId] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [priorizarNoJugados, setPriorizarNoJugados] = useState<boolean>(true);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [recentMatchesLimit, setRecentMatchesLimit] = useState<number>(5);
  const [soloAbiertos, setSoloAbiertos] = useState<boolean>(false);
  const [recentMatchesTotal, setRecentMatchesTotal] = useState<number>(0);
  const [lbScope, setLbScope] = useState<'competition' | 'global'>('competition');

  // Broadcast rooms
  const [broadcastRoom, setBroadcastRoom] = useState<string>('cancha-1');
  const [rooms, setRooms] = useState<BroadcastRoom[]>([]);
  const PARTIDO_URL = process.env.REACT_APP_PARTIDO_URL || 'https://overtime-partido.vercel.app';

  // Sede / cancha donde se está jugando
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');
  const [selectedCancha, setSelectedCancha] = useState<string>('');
  // true en cuanto el operador toca el campo de sala a mano; a partir de ahí dejamos de autocompletarlo.
  const roomEditedByUserRef = useRef(false);

  // Temporadas
  const [temporadas, setTemporadas] = useState<BackendTemporada[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');

  // Otras competencias ranked de la misma organización, para copiar presentes entre ellas
  const [otrasCompetenciasRanked, setOtrasCompetenciasRanked] = useState<BackendCompetencia[]>([]);

  // Modals for confirmation
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      }
    });
  };

  // Custom Hooks
  const {
    presentes,
    togglePresente,
    addManyPresentes,
    playedCounts,
    lastMatchPlayedIndex,
    matchTimelineLength,
    syncMatchAttendance,
    removeMatchAttendance,
    resetPlayedCounts,
    clearPresentes,
    markAllPresent
  } = useAttendance(competenciaId);

  // Sistema de puntuación de prioridad para ordenamiento
  const getPlayerScore = useCallback((playerId: string) => {
    let score = 0;

    // 1. Prioridad base: Estar presente (Crucial)
    const isPresent = presentes.includes(playerId);
    if (isPresent) score += 10000;

    // 1.5 Bonus de Fidelidad (Bonus de Liga)
    // Buscamos al jugador en el leaderboard actual (board)
    const stats = board.find(item => {
      const pId = typeof item.jugador === 'string' ? item.jugador : item.jugador?._id;
      return pId === playerId;
    });
    // Damos un pequeño empujón basado en su historial (1 punto por partido total)
    // Esto solo afecta el orden inicial para darles el "Presente" más rápido
    if (stats?.partidosJugados) {
      score += (stats.partidosJugados * 5); // +5 por cada partido histórico
    }

    // 2. Penalización por partidos jugados hoy (Priorizar a los que menos jugaron)
    // Esto es mucho más fuerte (-1000) que el bonus histórico (+5), por lo que
    // una vez que todos están presentes, la rotación diaria es la que manda.
    const count = playedCounts[playerId] || 0;
    score -= (count * 1000);

    // 3. Bonus por descanso (Recency Bias)
    const lastIndex = lastMatchPlayedIndex[playerId] || 0;
    const restDuration = lastIndex > 0 ? (matchTimelineLength - lastIndex) : 99; // 99 si no ha jugado nunca

    // Si acaba de jugar (restDuration 0), pierde mucha prioridad.
    // Si lleva 2 o más sin jugar, sube drásticamente.
    score += (restDuration * 100);

    return score;
  }, [presentes, playedCounts, lastMatchPlayedIndex, matchTimelineLength, board]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const scoreA = getPlayerScore(a._id);
      const scoreB = getPlayerScore(b._id);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Desempate alfabético
      return a.nombre.localeCompare(b.nombre);
    });
  }, [players, getPlayerScore]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const lb = await getLeaderboard({
        modalidad: modalidad as string,
        categoria: categoria as string,
        competition: competenciaId,
        season: lbScope === 'competition' ? (selectedTemporada || undefined) : undefined,
        limit: 500
      });
      setBoard(lb.items);
    } catch {}
  }, [modalidad, categoria, competenciaId, selectedTemporada, lbScope]);

  const fetchRecentMatches = useCallback(async () => {
    try {
      const [byComp, byTemp] = await Promise.all([
        getPartidosPorCompetencia(competenciaId),
        selectedTemporada ? getPartidosPorTemporada(selectedTemporada) : Promise.resolve([])
      ]);

      const merged = [...byComp, ...byTemp];
      const seen = new Set<string>();
      const unique = merged.filter((m: any) => {
        const id = (m?.id || m?._id || '').toString();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      const ranked = unique
        .filter((m: any) =>
          m.isRanked &&
          m.modalidad === modalidad &&
          m.categoria === categoria
        )
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const visibles = soloAbiertos ? ranked.filter((m: any) => m.estado !== 'finalizado') : ranked;
      setRecentMatchesTotal(visibles.length);
      setRecentMatches(visibles.slice(0, recentMatchesLimit));
    } catch {}
  }, [competenciaId, modalidad, categoria, recentMatchesLimit, selectedTemporada, soloAbiertos]);

  const {
    matchId,
    rojo,
    setRojo,
    azul,
    setAzul,
    score,
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
    setStartTime,
    isPaused,
    accumulatedTime,
    getEffectiveElapsed,
    togglePause,
    startNextSet,
    startTimer,
    matchConfig,
    isBasicMode,
    setIsBasicMode,
    onUpdateConfig,
    currentSetStartTime,
    isWaitingForNextSet
  } = useRankedMatch({
    competenciaId,
    modalidad,
    categoria,
    temporadaId: selectedTemporada,
    sedeId: selectedSedeId,
    cancha: selectedCancha,
    syncMatchAttendance,
    removeMatchAttendance,
    onSuccess: (msg) => {
      setSuccess(msg);
      fetchRecentMatches();
    },
    onError: (err) => { setError(err); },
    onFinalized: () => {
      fetchLeaderboard();
      fetchRecentMatches();
    }
  });

  // El estado de AFK vive acá (no en el marcador) para que tanto la pestaña
  // Equipos (donde se marca) como el botón Finalizar (que lo consume) lo compartan.
  useEffect(() => {
    setAfkPlayers([]);
  }, [matchId]);

  const handleEditResult = async (m: any) => {
    if (loadingMatch) return;
    const matchId = m.id || m._id;
    const isFinalizado = m.estado === 'finalizado' || m.estado === 'final';

    // Immediate feedback: Scroll to top and show loading
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const proceed = async () => {
      try {
        setLoadingMatch(true);

        // We can run the fetch and revert in parallel if it's finalized
        // to save time, as fetch doesn't depend on the outcome of revert
        const fetchPromise = getLeaderboardMatch(matchId);

        if (isFinalizado) {
          await revertMatch(matchId);
        }

        const { partido, sets: serverSets, teams } = await fetchPromise;

        if (!partido) throw new Error('No se encontró el partido');

        // Robust player extraction checking multiple possible locations
        const rawL = partido.rojoPlayers ||
                    teams?.find((t: any) => t.color === 'rojo')?.players ||
                    partido.matchTeams?.find((t: any) => t.color === 'rojo')?.players || [];

        const rawV = partido.azulPlayers ||
                    teams?.find((t: any) => t.color === 'azul')?.players ||
                    partido.matchTeams?.find((t: any) => t.color === 'azul')?.players || [];

        // Normalize to strings (IDs) to prevent React Error #31 and split() errors
        const eqL = rawL.map((p: any) => typeof p === 'string' ? p : (p?._id || p?.id || '')).filter(Boolean);
        const eqV = rawV.map((p: any) => typeof p === 'string' ? p : (p?._id || p?.id || '')).filter(Boolean);

        let cumulativeTime = 0;
        const setsData = (serverSets || []).map((s: any) => {
           const durationMs = (s.lastSetDuration || 0) * 1000;
           cumulativeTime += durationMs;
           return {
             _id: s._id,
             winner: s.ganadorSet === 'local' ? 'local' : 'visitante',
             time: cumulativeTime
           };
        });

        const externalStartTime = partido.rankedMeta?.startTime ? new Date(partido.rankedMeta.startTime).getTime() : null;

        setSelectedSedeId((partido.sede && typeof partido.sede === 'string' ? partido.sede : partido.sede?._id) || '');
        setSelectedCancha(partido.cancha || '');

        // Load into state
        loadMatch(
          matchId,
          eqL,
          eqV,
          { local: partido.marcadorLocal || 0, visitante: partido.marcadorVisitante || 0 },
          setsData,
          addManyPresentes,
          externalStartTime || undefined
        );

        setSuccess(isFinalizado ? 'Partido revertido para edición' : 'Partido cargado');
      } catch (e: any) {
        setError(e.message || 'Error al cargar el partido');
        console.error('Error in handleEditResult:', e);
      } finally {
        setLoadingMatch(false);
      }
    };

    if (isFinalizado) {
      showConfirm(
        'Corregir Resultado',
        `Se revertirán los puntos actuales del partido ${(matchId || '').slice(-6)} para editarlos. ¿Continuar?`,
        proceed
      );
    } else {
      proceed();
    }
  };

  const handleDeleteMatch = (m: any) => {
    const idParaBorrar = (m.id || m._id || '').toString();
    if (!idParaBorrar) return;

    showConfirm(
      '¿Borrar este partido?',
      `Se eliminará permanentemente el partido ${idParaBorrar.slice(-6).toUpperCase()} (quedó sin terminar). No se puede deshacer.`,
      async () => {
        try {
          if (matchId && idParaBorrar === matchId) {
            // Es el partido activo en pantalla: usar el flujo que ya limpia el estado local además de borrar en el servidor.
            await onCancelMatch();
          } else {
            await deleteRankedMatch(idParaBorrar);
          }
          setSuccess('Partido eliminado');
          fetchRecentMatches();
        } catch (e: any) {
          setError(e.message || 'Error al borrar el partido');
        }
      }
    );
  };

  // Initial Data Fetching
  useEffect(() => {
    if (!competenciaId) return;
    (async () => {
      try {
        const temps = await listTemporadasByCompetencia(competenciaId);
        setTemporadas(temps);
        if (temps.length > 0) {
          setSelectedTemporada(temps[temps.length - 1]._id);
        }

        const items = await listJugadoresCompetencia(competenciaId);
        const mapped = items
          .map((jc) => {
            const j = jc.jugador as any;
            const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?._id || '';
            return { _id: (j?._id ?? j) as string, nombre, jcId: jc._id };
          })
          .filter((p) => p._id);

        const seen = new Set<string>();
        const unique = mapped.filter((p) => (seen.has(p._id) ? false : (seen.add(p._id), true)));
        setCompPlayers(unique);

        const all = await listJugadores(500);
        const rawItems = Array.isArray(all) ? all : (all as any).items || [];
        const mappedAll = rawItems
          .map((j: any) => {
            const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?.apodo || j?._id || '';
            return { _id: j?._id as string, nombre };
          })
          .filter((p: any) => p._id);
        setAllPlayers(mappedAll);

        if (unique.length === 0) setShowAll(true);
      } catch (e: any) {
        setError(e.message || 'Error cargando datos');
      }
    })();
  }, [competenciaId]);

  useEffect(() => {
    setPlayers(showAll ? allPlayers : compPlayers);
  }, [showAll, allPlayers, compPlayers]);

  useEffect(() => {
    fetchLeaderboard();
    fetchRecentMatches();
  }, [fetchLeaderboard, fetchRecentMatches]);

  useEffect(() => {
    getRooms().then(setRooms).catch(() => {});
    const interval = setInterval(() => getRooms().then(setRooms).catch(() => {}), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!organizacionId) return;
    SedeService.getByOrganizacion(organizacionId).then(setSedes).catch(() => {});
  }, [organizacionId]);

  useEffect(() => {
    if (!organizacionId) return;
    listCompetenciasByOrganizacion(organizacionId)
      .then((comps) => setOtrasCompetenciasRanked(comps.filter((c) => c.rankedEnabled && c._id !== competenciaId)))
      .catch(() => {});
  }, [organizacionId, competenciaId]);

  const handleCopyPresentesDesde = (otraCompetenciaId: string) => {
    const otrosPresentes = readPresentesForCompetencia(otraCompetenciaId);
    if (otrosPresentes.length === 0) {
      setError('Esa competencia no tiene presentes marcados hoy');
      return;
    }
    addManyPresentes(otrosPresentes);
    setSuccess(`Se copiaron ${otrosPresentes.length} presentes`);
  };

  const selectedSede = sedes.find(s => s.id === selectedSedeId);

  // Autocompleta la sala de broadcast a partir de sede+cancha, sin pisar si el usuario ya la editó a mano.
  useEffect(() => {
    if (!selectedSede || !selectedCancha) return;
    if (roomEditedByUserRef.current) return;
    setBroadcastRoom(slugify(`${selectedSede.nombre}-${selectedCancha}`));
  }, [selectedSede, selectedCancha]);

  const handleSedeChange = (sedeId: string) => {
    setSelectedSedeId(sedeId);
    setSelectedCancha('');
    if (matchId) {
      updateMatchLocation(matchId, sedeId || null, null).catch((e: any) => setError(e.message || 'Error actualizando sede'));
    }
  };

  const handleCanchaChange = (cancha: string) => {
    setSelectedCancha(cancha);
    if (matchId) {
      updateMatchLocation(matchId, selectedSedeId || null, cancha || null).catch((e: any) => setError(e.message || 'Error actualizando cancha'));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const nameById = (id: string) => players.find((p) => p._id === id)?.nombre || id;

  const onChooseForNextMatch = () => {
    const pool = presentes.filter((id) => players.some((p) => p._id === id));
    const sorted = pool.sort((a, b) => (playedCounts[a] || 0) - (playedCounts[b] || 0));
    const picked = (priorizarNoJugados ? sorted : pool).slice(0, 18);
    setSelected(picked);
  };

  const handleMarkAsRanked = async () => {
    try {
      await markMatchAsRanked(convertId.trim());
      setSuccess('Partido marcado como ranked');
      setConvertId('');
    } catch (e: any) {
      setError(e.message || 'Error marcando partido');
    }
  };

  const handleRevertMatch = () => {
    showConfirm(
      '¿Revertir Stats?',
      'Se restarán los puntos a los jugadores y se eliminará el registro.',
      async () => {
        try {
          await revertMatch(revertId.trim());
          setRevertId('');
          setSuccess('Partido revertido con éxito');
          fetchLeaderboard();
        } catch (e: any) {
          setError(e.message || 'Error revirtiendo');
        }
      }
    );
  };

  const handleRecalculateScopeRankings = () => {
    showConfirm(
      'Recalcular MMR del Scope',
      'Se recalcularán los MMR desde los snapshots de este scope. Esto puede tardar unos segundos.',
      async () => {
        try {
          const res = await recalculateScopeRankings({
            competenciaId,
            temporadaId: lbScope === 'competition' ? (selectedTemporada || undefined) : undefined,
            modalidad,
            categoria
          });
          setSuccess(`MMR recalculado (${res.updatedCount} jugadores)`);
          fetchLeaderboard();
        } catch (e: any) {
          setError(e.message || 'Error recalculando MMR');
        }
      }
    );
  };

  const handleResetScope = () => {
    const scope = `${modalidad} - ${categoria}${selectedTemporada ? ` - Temporada seleccionada` : ''}`;
    showConfirm(
      '¿Resetear este Scope?',
      `Se eliminarán los rankings solo de: ${scope}. Esta acción no se puede deshacer.`,
      async () => {
        try {
          await resetScopeRankings({
            competenciaId,
            temporadaId: selectedTemporada || undefined,
            modalidad: modalidad as string,
            categoria: categoria as string
          });
          setSuccess('Scope reseteado con éxito');
          fetchLeaderboard();
        } catch (e: any) {
          setError(e.message || 'Error reseteando scope');
        }
      }
    );
  };

  const handleResetAll = () => {
    showConfirm(
      '¡PELIGRO: Reset TOTAL!',
      'Esto eliminará ABSOLUTAMENTE TODOS los rankings del sistema. ¿Estás seguro?',
      async () => {
        try {
          await resetAllRankings();
          setSuccess('Sistema reseteado por completo');
          fetchLeaderboard();
        } catch (e: any) {
          setError(e.message || 'Error en reset global');
        }
      }
    );
  };

  const onEliminarJugador = (playerId: string) => {
    const player = compPlayers.find(p => p._id === playerId);
    if (!player?.jcId) return;

    showConfirm(
      '¿Eliminar Jugador?',
      `¿Seguro que deseas quitar a ${player.nombre} de esta competencia?`,
      async () => {
        try {
          await eliminarJugadorCompetencia(player.jcId!);
          setCompPlayers(prev => prev.filter(p => p._id !== playerId));
          setSuccess('Jugador eliminado de la competencia');
        } catch (e: any) {
          setError(e.message);
        }
      }
    );
  };

  const onAgregarJugadorCompetencia = async (id: string) => {
    if (!id) return;
    try {
      await crearJugadorCompetencia({ jugador: id, competencia: competenciaId });
      const items = await listJugadoresCompetencia(competenciaId);
      const mapped = items.map((jc) => {
        const j = jc.jugador as any;
        const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?._id || '';
        return { _id: (j?._id ?? j) as string, nombre, jcId: jc._id };
      }).filter((p) => p._id);
      setCompPlayers(mapped);
      setSuccess('Jugador agregado con éxito');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onQuickAddPlayer = async (datos: {
    nombre: string;
    alias?: string;
    genero?: string;
    fechaNacimiento?: string;
  }) => {
    try {
      const newPlayer = await crearJugador(datos);

      const playerId = newPlayer._id;

      // 2. Vincular a competencia
      await crearJugadorCompetencia({ jugador: playerId, competencia: competenciaId });

      // 3. Actualizar listas locales
      const nombre = [newPlayer.nombre, newPlayer.apellido].filter(Boolean).join(' ') || newPlayer.alias || newPlayer.nombre;
      const mappedNew = { _id: playerId, nombre };

      setAllPlayers(prev => [mappedNew, ...prev]);
      setCompPlayers(prev => [{ ...mappedNew, jcId: 'temp-' + Date.now() }, ...prev]); // Actualizamos la lista de competencia

      // 4. Marcarlo como presente automáticamente
      togglePresente(playerId, true);

      setSuccess(`Jugador ${nombre} creado y agregado`);
    } catch (e: any) {
      setError(e.message || 'Error en Quick Add');
      throw e;
    }
  };

  const TABS: { id: RankedTab; label: string }[] = [
    { id: 'presentes', label: 'Presentes' },
    { id: 'equipos', label: 'Equipos' },
    { id: 'ranking', label: 'Ranking' },
    { id: 'mas', label: 'Más' },
  ];

  return (
    <div className="relative pb-16">
      {/* Loading Match Overlay */}
      {loadingMatch && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4 max-w-xs text-center animate-in zoom-in duration-200">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase tracking-tight">Procesando Partido</p>
              <p className="text-[11px] text-slate-500 font-medium">Revirtiendo puntos y cargando rosters... Esto puede tardar unos segundos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div
          onClick={() => setError(null)}
          className="fixed top-4 right-4 z-[100] cursor-pointer rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg animate-in fade-in slide-in-from-top-4 min-w-[200px] max-w-xs"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <span className="text-red-400 font-bold shrink-0">×</span>
          </div>
        </div>
      )}
      {success && (
        <div
          onClick={() => setSuccess(null)}
          className="fixed bottom-4 right-4 z-[100] cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-lg animate-in fade-in slide-in-from-bottom-4 min-w-[200px] max-w-xs"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-bold">Éxito</p>
              <p>{success}</p>
            </div>
            <span className="text-emerald-400 font-bold shrink-0">×</span>
          </div>
        </div>
      )}

      {/* Shell fijo: config compacta + estado del partido + marcador + pestañas */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            🏐 {modalidad || '—'} · {categoria || '—'}
            <span className={`text-[9px] transition-transform ${configOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {matchId ? (
            <button
              type="button"
              onClick={() => setMatchBarOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-[10px] font-black uppercase text-emerald-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En curso
              <span className={`text-[9px] transition-transform ${matchBarOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateMatch}
              disabled={busy || !modalidad || !categoria}
              className="text-xs whitespace-nowrap"
            >
              + Nuevo Partido
            </Button>
          )}
        </div>

        {configOpen && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Temporada</label>
                <select
                  value={selectedTemporada}
                  onChange={(e) => setSelectedTemporada(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-400"
                  disabled={busy || !!matchId}
                >
                  <option value="">Sin temporada</option>
                  {temporadas.map(t => (
                    <option key={t._id} value={t._id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              {sedes.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Sede</label>
                  <select
                    value={selectedSedeId}
                    onChange={(e) => handleSedeChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                    disabled={busy}
                  >
                    <option value="">Sin sede</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSede && (selectedSede.canchas?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Cancha</label>
                  <select
                    value={selectedCancha}
                    onChange={(e) => handleCanchaChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                    disabled={busy}
                  >
                    <option value="">Sin cancha</option>
                    {selectedSede.canchas!.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500" title="Online: sincroniza con el servidor. Offline: guarda solo localmente.">
                  Modo
                </label>
                <div className="flex items-center h-10 bg-white border border-slate-200 rounded-md p-1 gap-1">
                  <button
                    onClick={() => setIsBasicMode(false)}
                    className={`flex-1 rounded text-[11px] font-bold transition-all ${!isBasicMode ? 'bg-slate-100 text-brand-600' : 'text-slate-400'}`}
                    title="Sincroniza equipos y sets con el servidor en tiempo real"
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setIsBasicMode(true)}
                    className={`flex-1 rounded text-[11px] font-bold transition-all ${isBasicMode ? 'bg-slate-100 text-brand-600' : 'text-slate-400'}`}
                    title="Guarda el estado solo en este dispositivo"
                  >
                    Offline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {matchId && matchBarOpen && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 sm:px-4 flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">ID: {matchId.slice(-6).toUpperCase()}</span>
            <div className="flex gap-4">
              <button onClick={abandonMatch} className="text-[11px] text-slate-500 hover:text-slate-700 font-bold uppercase tracking-tight underline underline-offset-2">Abandonar</button>
              <button onClick={() => showConfirm('¿Eliminar Partido?', 'Se perderá el progreso de este partido.', onCancelMatch)} className="text-[11px] text-red-500 hover:text-red-700 font-bold uppercase tracking-tight underline underline-offset-2">Eliminar</button>
            </div>
          </div>
        )}

        <RankedScoreboard
          score={score}
          sets={sets}
          addSet={addSet}
          removeLastSet={removeLastSet}
          adjustScore={adjustScore}
          onFinalize={() => showConfirm('¿Finalizar Partido?', 'Los puntos se aplicarán permanentemente.', () => onFinalizeMatch(afkPlayers))}
          busy={busy}
          matchActive={!!matchId}
          startTime={startTime}
          accumulatedTime={accumulatedTime}
          isPaused={isPaused}
          getEffectiveElapsed={getEffectiveElapsed}
          togglePause={togglePause}
          startNextSet={startNextSet}
          setStartTime={(val: number | null) => setStartTime(val)}
          currentSetStartTime={currentSetStartTime}
          isWaitingForNextSet={isWaitingForNextSet}
          startTimer={startTimer}
          modalidad={modalidad as string}
          matchId={matchId}
          matchConfig={matchConfig}
          isBasicMode={isBasicMode}
          onUpdateConfig={onUpdateConfig}
        />

        <div className="flex gap-1 px-2 py-1.5 bg-slate-100/70 border-t border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md py-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${
                activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="p-3 sm:p-4">
        {activeTab === 'presentes' && (
          <RankedPlayerSelector
            players={sortedPlayers}
            compPlayers={compPlayers}
            filter={filter}
            setFilter={setFilter}
            selected={selected}
            toggleSelect={toggleSelect}
            presentes={presentes}
            lastMatchPlayedIndex={lastMatchPlayedIndex}
            matchTimelineLength={matchTimelineLength}
            togglePresente={togglePresente}
            playedCounts={playedCounts}
            showAll={showAll}
            setShowAll={setShowAll}
            onAgregarJugador={onAgregarJugadorCompetencia}
            onEliminarJugador={onEliminarJugador}
            onQuickAddPlayer={onQuickAddPlayer}
            onChooseForNext={onChooseForNextMatch}
            onMarkAllPresent={() => showConfirm('¿Marcar a todos presentes?', 'Se va a marcar como presentes a todos los jugadores de la competencia.', () => markAllPresent(compPlayers.map(p => p._id)))}
            onClearPresentes={() => showConfirm('¿Limpiar los presentes?', 'Vas a tener que volver a marcar la asistencia de todos desde cero.', clearPresentes)}
            otrasCompetencias={otrasCompetenciasRanked}
            onCopyPresentesDesde={handleCopyPresentesDesde}
            onClearSelected={() => showConfirm('¿Deseleccionar jugadores?', `Se van a deseleccionar los ${selected.length} jugadores tildados ahora.`, () => setSelected([]))}
            onResetPJHoy={() => showConfirm('¿Reiniciar PJ de hoy?', 'Se ponen en cero los partidos jugados de todos los jugadores en la sesión de hoy. No afecta el ranking.', resetPlayedCounts)}
            priorizarNoJugados={priorizarNoJugados}
            setPriorizarNoJugados={setPriorizarNoJugados}
            busy={busy}
            onAutoAssign={() => {
              const pool = selected.length > 0 ? selected : presentes;
              onAutoAssign(pool, playedCounts);
            }}
            onAddToRojo={() => setRojo(prev => [...new Set([...prev, ...selected])])}
            onAddToAzul={() => setAzul(prev => [...new Set([...prev, ...selected])])}
            matchActive={!!matchId}
          />
        )}

        {activeTab === 'equipos' && (
          <TeamBuilder
            rojo={rojo}
            azul={azul}
            nameById={nameById}
            onRemoveFromRojo={(id) => setRojo(prev => prev.filter(x => x !== id))}
            onRemoveFromAzul={(id) => setAzul(prev => prev.filter(x => x !== id))}
            onSaveAssignment={onSaveAssignment}
            busy={busy}
            matchActive={!!matchId}
            afkPlayers={afkPlayers}
            onToggleAFK={toggleAFK}
          />
        )}

        {activeTab === 'ranking' && (
          <RankedLeaderboard
            board={board}
            lbScope={lbScope}
            setLbScope={setLbScope}
            onRefreshLeaderboard={fetchLeaderboard}
            busy={busy}
            competenciaId={competenciaId}
            modalidad={modalidad as string}
            categoria={categoria as string}
            seasonId={selectedTemporada}
            seasonName={temporadas.find(t => t._id === selectedTemporada)?.nombre}
          />
        )}

        {activeTab === 'mas' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <h3 className="mb-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Transmisión</h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  list="rooms-datalist"
                  value={broadcastRoom}
                  onChange={e => { roomEditedByUserRef.current = true; setBroadcastRoom(e.target.value); }}
                  placeholder="nombre-sala"
                  className="h-10 flex-1 min-w-[140px] rounded border border-slate-200 px-2 text-xs outline-none focus:ring-1 focus:ring-brand-500"
                />
                <datalist id="rooms-datalist">
                  {rooms.map(r => <option key={r.roomId} value={r.roomId} />)}
                  <option value="cancha-1" />
                  <option value="cancha-2" />
                  <option value="cancha-3" />
                </datalist>
                {matchId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!broadcastRoom.trim()) return;
                      try {
                        await assignMatchToRoom(broadcastRoom.trim(), matchId);
                        setSuccess(`Partido asignado a "${broadcastRoom}"`);
                        getRooms().then(setRooms).catch(() => {});
                      } catch (e: any) {
                        setError(e.message || 'Error asignando sala');
                      }
                    }}
                    disabled={busy || !broadcastRoom.trim()}
                    className="h-10 px-3 rounded bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    Asignar
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={`${PARTIDO_URL}/overlay?room=${encodeURIComponent(broadcastRoom || 'cancha-1')}&transparent=true`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center flex items-center justify-center gap-1 h-10 px-2.5 rounded border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap"
                  title="Abrir overlay OBS (fondo transparente)"
                >
                  🖥 Overlay
                </a>
                <a
                  href={`${PARTIDO_URL}/broadcast?room=${encodeURIComponent(broadcastRoom || 'cancha-1')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center flex items-center justify-center gap-1 h-10 px-2.5 rounded border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap"
                  title="Abrir consola de broadcast"
                >
                  📺 Broadcast
                </a>
              </div>
            </div>

            <RankedAdminTools
              convertId={convertId}
              setConvertId={setConvertId}
              onMarkAsRanked={handleMarkAsRanked}
              revertId={revertId}
              setRevertId={setRevertId}
              onRevertMatch={handleRevertMatch}
              onResetScopeRankings={handleResetScope}
              onResetAllRankings={handleResetAll}
              onRecalculateScopeRankings={handleRecalculateScopeRankings}
              onRecalculateGlobalRankings={async () => {
                try {
                  await recalculateGlobalRankings();
                  setSuccess('ELO Global recalculado');
                } catch(e: any) { setError(e.message); }
              }}
              onSyncWins={async () => {
                try {
                  const res = await syncAllWins();
                  setSuccess(`Winrates sincronizados (${res.updatedCount} jugadores)`);
                  fetchLeaderboard();
                } catch(e: any) { setError(e.message); }
              }}
              onCleanupGhosts={async () => {
                showConfirm(
                  '¿Limpiar Fantasmas?',
                  'Se eliminarán del ranking todos los jugadores con 0 partidos en este scope.',
                  async () => {
                    try {
                      const res = await cleanupGhostPlayers({
                        competition: competenciaId,
                        season: selectedTemporada || undefined,
                        modalidad,
                        categoria
                      });
                      setSuccess(`Se eliminaron ${res.deletedCount} registros vacíos.`);
                      fetchLeaderboard();
                    } catch(e: any) { setError(e.message); }
                  }
                );
              }}
              busy={busy || loadingMatch}
              modalidad={modalidad}
              categoria={categoria}
              selectedTemporada={selectedTemporada}
              recentMatches={recentMatches}
              onEditResult={handleEditResult}
              onDeleteMatch={handleDeleteMatch}
              soloAbiertos={soloAbiertos}
              setSoloAbiertos={setSoloAbiertos}
              hasMoreRecentMatches={recentMatchesTotal > recentMatches.length}
              onLoadMoreRecentMatches={() => setRecentMatchesLimit(prev => prev + 5)}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
