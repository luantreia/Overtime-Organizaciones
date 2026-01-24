import React, { useEffect, useState, useCallback } from 'react';
import { 
  getLeaderboard, 
  markMatchAsRanked, 
  listJugadores, 
  crearJugador,
  revertMatch, 
  resetAllRankings, 
  resetScopeRankings, 
  recalculateGlobalRankings 
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
  
  const [convertId, setConvertId] = useState<string>('');
  const [revertId, setRevertId] = useState<string>('');
  const [nuevoJugadorId, setNuevoJugadorId] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [priorizarNoJugados, setPriorizarNoJugados] = useState<boolean>(true);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

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
    playedCounts, 
    incrementPlayedCount, 
    decrementPlayedCount,
    resetPlayedCounts, 
    clearPresentes, 
    markAllPresent 
  } = useAttendance(competenciaId);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const lb = await getLeaderboard({ 
        modalidad: modalidad as string, 
        categoria: categoria as string, 
        competition: competenciaId, 
        season: selectedTemporada || undefined,
        limit: 20 
      });
      setBoard(lb.items);
    } catch {}
  }, [modalidad, categoria, competenciaId, selectedTemporada]);

  const fetchRecentMatches = useCallback(async () => {
    try {
      const all = await getPartidosPorCompetencia(competenciaId);
      const ranked = all
        .filter((m: any) => 
          m.isRanked && 
          m.estado === 'finalizado' && 
          m.modalidad === modalidad && 
          m.categoria === categoria
        )
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5);
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
    decrementPlayedCount,
    incrementPlayedCount,
    onSuccess: (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); },
    onError: (err) => { setError(err); setTimeout(() => setError(null), 5000); },
    onFinalized: () => {
      fetchLeaderboard();
      fetchRecentMatches();
    }
  });

  const handleEditResult = async (m: any) => {
    showConfirm(
      'Corregir Resultado',
      `Se revertirán los puntos actuales del partido ${m._id.slice(-6)} para editarlos. ¿Continuar?`,
      async () => {
        try {
          await revertMatch(m._id);
          
          // Buscamos los IDs de los jugadores de los equipos
          // El backend de listPartidos debería traerlos, o los buscamos por matchId
          const eqL = m.rojoPlayers || [];
          const eqV = m.azulPlayers || [];

          loadMatch(m._id, eqL, eqV, { local: m.marcadorLocal || 0, visitante: m.marcadorVisitante || 0 });
          setSuccess('Partido cargado para corrección');
        } catch (e: any) {
          setError(e.message || 'Error al cargar para edición');
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

  const onAgregarJugadorCompetencia = async (id?: string) => {
    const targetId = id || nuevoJugadorId.trim();
    if (!targetId) return;
    try {
      await crearJugadorCompetencia({ jugador: targetId, competencia: competenciaId });
      setNuevoJugadorId('');
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

  const onQuickAddPlayer = async (datos: { nombre: string; alias?: string; genero?: string }) => {
    try {
      const res = await crearJugador(datos);
      if (!res.success) throw new Error('No se pudo crear el jugador');
      
      const newPlayer = res.data;
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
    <div className="space-y-6 pb-20">
      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg animate-in fade-in slide-in-from-top-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-lg animate-in fade-in slide-in-from-top-4">
          <p className="font-bold">Éxito</p>
          <p>{success}</p>
        </div>
      )}

      {/* Header Config */}
      <Card className="p-4 border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Modalidad</label>
            <div className="h-9 px-3 flex items-center bg-slate-50 rounded border text-sm font-medium text-slate-700">{modalidad || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Categoría</label>
            <div className="h-9 px-3 flex items-center bg-slate-50 rounded border text-sm font-medium text-slate-700">{categoria || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Temporada</label>
            <select 
              value={selectedTemporada} 
              onChange={(e) => setSelectedTemporada(e.target.value)}
              className="h-9 w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-400"
              disabled={busy || !!matchId}
            >
              <option value="">Sin temporada (Global)</option>
              {temporadas.map(t => (
                <option key={t._id} value={t._id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {!matchId ? (
            <Button 
              variant="primary" 
              onClick={onCreateMatch} 
              disabled={busy || !modalidad || !categoria}
              className="px-6"
            >
              Iniciar sesión Ranked
            </Button>
          ) : (
            <div className="flex gap-2 items-center bg-brand-50 rounded-lg p-1 pr-3 border border-brand-100">
               <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-md ml-1 animate-pulse">EN CURSO</span>
               <span className="text-[10px] text-brand-700 font-medium">ID: {matchId.slice(-6)}</span>
               <div className="h-4 w-[1px] bg-brand-200 mx-1" />
               <button onClick={abandonMatch} className="text-[10px] text-slate-500 hover:text-slate-700 font-bold uppercase tracking-tight">Abandonar</button>
               <button onClick={() => showConfirm('¿Eliminar Partido?', 'Se perderá el progreso de este partido.', onCancelMatch)} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-tight">Eliminar</button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Workflow Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
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
              nuevoJugadorId={nuevoJugadorId}
              setNuevoJugadorId={setNuevoJugadorId}
              onAgregarNuevoJugador={() => onAgregarJugadorCompetencia()}
              onQuickAddPlayer={onQuickAddPlayer}
              onChooseForNext={onChooseForNextMatch}
              onMarkAllPresent={() => markAllPresent(compPlayers.map(p => p._id))}
              onClearPresentes={clearPresentes}
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

        <div className="lg:col-span-4">
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

        <div className="lg:col-span-4">
          <RankedFinalize 
            score={score}
            sets={sets}
            addSet={addSet}
            removeLastSet={removeLastSet}
            adjustScore={adjustScore}
            onFinalize={() => showConfirm('¿Finalizar Partido?', 'Los puntos se aplicarán permanentemente.', onFinalizeMatch)}
            busy={busy}
            matchActive={!!matchId}
            board={board}
            startTime={startTime}
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
          busy={busy}
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

