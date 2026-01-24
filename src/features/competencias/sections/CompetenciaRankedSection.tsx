import React, { useEffect, useState, useCallback } from 'react';
import { 
  getLeaderboard, 
  markMatchAsRanked, 
  listJugadores, 
  crearJugador,
  revertMatch, 
  resetAllRankings, 
  resetScopeRankings, 
  recalculateGlobalRankings,
  syncAllWins,
  cleanupGhostPlayers
} from '../../ranked/services/rankedService';
import { 
  crearJugadorCompetencia, 
  listJugadoresCompetencia, 
  eliminarJugadorCompetencia 
} from '../../jugadores/services/jugadorCompetenciaService';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import { listTemporadasByCompetencia, type BackendTemporada } from '../services';

// Hooks
import { useAttendance } from '../hooks/useAttendance';
import { useRankedMatch } from '../hooks/useRankedMatch';

// Components
import { RankedPlayerSelector } from './ranked/RankedPlayerSelector';
import { TeamBuilder } from './ranked/TeamBuilder';
import { RankedFinalize } from './ranked/RankedFinalize';
import { RankedAdminTools } from './ranked/RankedAdminTools';

// Shared UI
import { Button, Card } from '../../../shared/components/ui';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

export default function CompetenciaRankedSection({
  competenciaId,
  modalidad,
  categoria,
}: {
  competenciaId: string;
  modalidad: 'Foam' | 'Cloth' | '';
  categoria: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '';
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
  const [lbScope, setLbScope] = useState<'competition' | 'global'>('competition');

  // Temporadas
  const [temporadas, setTemporadas] = useState<BackendTemporada[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');

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
    syncMatchAttendance,
    removeMatchAttendance,
    resetPlayedCounts, 
    clearPresentes, 
    markAllPresent 
  } = useAttendance(competenciaId);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const lb = await getLeaderboard({ 
        modalidad: modalidad as string, 
        categoria: categoria as string, 
        competition: lbScope === 'competition' ? competenciaId : undefined, 
        season: lbScope === 'competition' ? (selectedTemporada || undefined) : undefined,
        limit: 100 
      });
      setBoard(lb.items);
    } catch {}
  }, [modalidad, categoria, competenciaId, selectedTemporada, lbScope]);

  const fetchRecentMatches = useCallback(async () => {
    try {
      const all = await getPartidosPorCompetencia(competenciaId);
      const ranked = all
        .filter((m: any) => 
          m.isRanked && 
          m.modalidad === modalidad && 
          m.categoria === categoria
        )
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 10);
      setRecentMatches(ranked);
    } catch {}
  }, [competenciaId, modalidad, categoria]);

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
    startTime
  } = useRankedMatch({
    competenciaId,
    modalidad,
    categoria,
    temporadaId: selectedTemporada,
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

  const handleEditResult = async (m: any) => {
    const matchId = m.id || m._id;
    const isFinalizado = m.estado === 'finalizado';
    
    const proceed = async () => {
      try {
        setLoadingMatch(true);
        if (isFinalizado) {
          await revertMatch(matchId);
        }
        
        // Buscamos los IDs de los jugadores de los equipos
        const eqL = m.rojoPlayers || [];
        const eqV = m.azulPlayers || [];
        // El backend puede llamar al campo 'sets' o 'setDetalles'
        const setsData = (m.sets || []).map((s: any) => ({
           winner: s.ganadorSet === 'local' ? 'local' : 'visitante',
           time: s.duracionReal ? s.duracionReal * 1000 : 0
        }));

        loadMatch(matchId, eqL, eqV, { local: m.marcadorLocal || 0, visitante: m.marcadorVisitante || 0 }, setsData, addManyPresentes);
        setSuccess(isFinalizado ? 'Partido cargado para corrección' : 'Partido cargado para continuar');
      } catch (e: any) {
        setError(e.message || 'Error al cargar el partido');
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

        const all = await listJugadores(200);
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

  return (
    <div className="space-y-6 pb-20 relative">
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
          className="fixed top-4 right-4 z-[100] cursor-pointer rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg animate-in fade-in slide-in-from-top-4 min-w-[200px]"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <span className="text-red-400 font-bold">×</span>
          </div>
        </div>
      )}
      {success && (
        <div 
          onClick={() => setSuccess(null)}
          className="fixed top-4 right-4 z-[100] cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-lg animate-in fade-in slide-in-from-top-4 min-w-[200px]"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-bold">Éxito</p>
              <p>{success}</p>
            </div>
            <span className="text-emerald-400 font-bold">×</span>
          </div>
        </div>
      )}

      {/* Header Config */}
      <Card className="p-3 sm:p-4 border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Modalidad</label>
              <div className="h-9 px-3 flex items-center bg-slate-50 rounded border text-xs sm:text-sm font-medium text-slate-700">{modalidad || 'N/A'}</div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Categoría</label>
              <div className="h-9 px-3 flex items-center bg-slate-50 rounded border text-xs sm:text-sm font-medium text-slate-700">{categoria || 'N/A'}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Temporada</label>
            <select 
              value={selectedTemporada} 
              onChange={(e) => setSelectedTemporada(e.target.value)}
              className="h-9 w-full sm:w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-400"
              disabled={busy || !!matchId}
            >
              <option value="">Sin temporada (Global)</option>
              {temporadas.map(t => (
                <option key={t._id} value={t._id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-end">
            {!matchId ? (
              <Button 
                variant="primary" 
                onClick={onCreateMatch} 
                disabled={busy || !modalidad || !categoria}
                className="w-full sm:w-auto px-6 whitespace-nowrap"
              >
                Iniciar sesión Ranked
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2 items-center bg-brand-50 rounded-lg p-1.5 pr-3 border border-brand-100 w-full sm:w-auto">
                 <span className="bg-brand-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded ml-1 animate-pulse uppercase">EN CURSO</span>
                 <span className="text-[9px] sm:text-[10px] text-brand-700 font-medium">ID: {matchId.slice(-6).toUpperCase()}</span>
                 <div className="hidden sm:block h-4 w-[1px] bg-brand-200 mx-1" />
                 <div className="flex gap-3 ml-auto sm:ml-0">
                   <button onClick={abandonMatch} className="text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-700 font-bold uppercase tracking-tight">Abandonar</button>
                   <button onClick={() => showConfirm('¿Eliminar Partido?', 'Se perderá el progreso de este partido.', onCancelMatch)} className="text-[9px] sm:text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-tight">Eliminar</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Workflow Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <div>
           <RankedPlayerSelector
              players={players}
              compPlayers={compPlayers}
              filter={filter}
              setFilter={setFilter}
              selected={selected}
              toggleSelect={toggleSelect}
              presentes={presentes}
              togglePresente={togglePresente}
              playedCounts={playedCounts}
              showAll={showAll}
              setShowAll={setShowAll}
              onAgregarJugador={onAgregarJugadorCompetencia}
              onEliminarJugador={onEliminarJugador}
              onQuickAddPlayer={onQuickAddPlayer}
              onChooseForNext={onChooseForNextMatch}
              onMarkAllPresent={() => markAllPresent(compPlayers.map(p => p._id))}
              onClearPresentes={clearPresentes}
              onClearSelected={() => setSelected([])}
              onResetPJHoy={() => showConfirm('Reset PJ', '¿Reiniciar contadores de partidos jugados hoy?', resetPlayedCounts)}
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
        </div>

        <div>
          <TeamBuilder 
            rojo={rojo}
            azul={azul}
            nameById={nameById}
            onRemoveFromRojo={(id) => setRojo(prev => prev.filter(x => x !== id))}
            onRemoveFromAzul={(id) => setAzul(prev => prev.filter(x => x !== id))}
            onSaveAssignment={onSaveAssignment}
            busy={busy}
            matchActive={!!matchId}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-1">
          <RankedFinalize 
            score={score}
            sets={sets}
            addSet={addSet}
            removeLastSet={removeLastSet}
            adjustScore={adjustScore}
            onFinalize={(afkIds) => showConfirm('¿Finalizar Partido?', 'Los puntos se aplicarán permanentemente.', () => onFinalizeMatch(afkIds))}
            busy={busy}
            matchActive={!!matchId}
            board={board}
            lbScope={lbScope}
            setLbScope={setLbScope}
            startTime={startTime}
            onRefreshLeaderboard={fetchLeaderboard}
            competenciaId={competenciaId}
            modalidad={modalidad as string}
            categoria={categoria as string}
            seasonId={selectedTemporada}
            rojoIds={rojo}
            azulIds={azul}
            nameById={nameById}
          />
        </div>
      </div>

      {/* Admin Section */}
      <div className="pt-8 border-t border-slate-100">
        <RankedAdminTools 
          convertId={convertId}
          setConvertId={setConvertId}
          onMarkAsRanked={handleMarkAsRanked}
          revertId={revertId}
          setRevertId={setRevertId}
          onRevertMatch={handleRevertMatch}
          onResetScopeRankings={handleResetScope}
          onResetAllRankings={handleResetAll}
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
        />
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

