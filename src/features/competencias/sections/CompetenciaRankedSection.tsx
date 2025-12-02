import React, { useEffect, useMemo, useState } from 'react';
import { autoAssign, assignTeams, createRankedMatch, finalizeMatch, getLeaderboard, markMatchAsRanked, listJugadores } from '../../ranked/services/rankedService';
import { crearJugadorCompetencia, listJugadoresCompetencia } from '../../jugadores/services/jugadorCompetenciaService';
import { listTemporadasByCompetencia, type BackendTemporada } from '../services';

export default function CompetenciaRankedSection({
  competenciaId,
  modalidad,
  categoria,
}: {
  competenciaId: string;
  modalidad: 'Foam' | 'Cloth' | '';
  categoria: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '';
}) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [compPlayers, setCompPlayers] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [allPlayers, setAllPlayers] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [rojo, setRojo] = useState<string[]>([]);
  const [azul, setAzul] = useState<string[]>([]);
  const [score, setScore] = useState({ local: 0, visitante: 0 });
  const [board, setBoard] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string>('');
  const [nuevoJugadorId, setNuevoJugadorId] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [presentes, setPresentes] = useState<string[]>([]);
  const [playedCounts, setPlayedCounts] = useState<Record<string, number>>({});
  const [priorizarNoJugados, setPriorizarNoJugados] = useState<boolean>(true);

  // Temporadas
  const [temporadas, setTemporadas] = useState<BackendTemporada[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');

  useEffect(() => {
    if (!competenciaId) return;
    (async () => {
      try {
        // load seasons
        const temps = await listTemporadasByCompetencia(competenciaId);
        setTemporadas(temps);
        // default to last season
        if (temps.length > 0) {
          setSelectedTemporada(temps[temps.length - 1]._id);
        }

        // competencia players
        const items = await listJugadoresCompetencia(competenciaId);
        const mapped = items
          .map((jc) => {
            const j = jc.jugador as any;
            const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?._id || '';
            return { _id: (j?._id ?? j) as string, nombre };
          })
          .filter((p) => p._id);
        const seen = new Set<string>();
        const unique = mapped.filter((p) => (seen.has(p._id) ? false : (seen.add(p._id), true)));
        setCompPlayers(unique);

        // all players (for adding or broader selection)
        const all = await listJugadores(200);
        const mappedAll = (all as any[])
          .map((j: any) => {
            const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?.apodo || j?._id || '';
            return { _id: j?._id as string, nombre };
          })
          .filter((p) => p._id);
        setAllPlayers(mappedAll);

        // auto-enable showAll only if competencia has none yet
        if (unique.length === 0) setShowAll(true);
      } catch (e: any) {
        setError(e.message || 'Error cargando jugadores');
      }
    })();
  }, [competenciaId]);

  useEffect(() => {
    setPlayers(showAll ? allPlayers : compPlayers);
  }, [showAll, allPlayers, compPlayers]);

  // Persistencia básica por sesión de fecha (día actual) en localStorage
  const sessionKey = useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return `rankedSession:${competenciaId}:${iso}`;
  }, [competenciaId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPresentes(Array.isArray(parsed.presentes) ? parsed.presentes : []);
        setPlayedCounts(parsed.playedCounts && typeof parsed.playedCounts === 'object' ? parsed.playedCounts : {});
      }
    } catch {}
  }, [sessionKey]);

  useEffect(() => {
    try {
      localStorage.setItem(sessionKey, JSON.stringify({ presentes, playedCounts }));
    } catch {}
  }, [sessionKey, presentes, playedCounts]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return players;
    return players.filter((p) => p.nombre?.toLowerCase().includes(f));
  }, [players, filter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addToRojo = () => {
    setRojo((prev) => {
      const remainingSlots = Math.max(0, 9 - prev.length);
      const toAdd = selected.filter((id) => !prev.includes(id) && !azul.includes(id)).slice(0, remainingSlots);
      return [...prev, ...toAdd];
    });
  };

  const addToAzul = () => {
    setAzul((prev) => {
      const remainingSlots = Math.max(0, 9 - prev.length);
      const toAdd = selected.filter((id) => !prev.includes(id) && !rojo.includes(id)).slice(0, remainingSlots);
      return [...prev, ...toAdd];
    });
  };

  const removeFromRojo = (id: string) => setRojo((prev) => prev.filter((x) => x !== id));
  const removeFromAzul = (id: string) => setAzul((prev) => prev.filter((x) => x !== id));

  const chooseForNextMatch = () => {
    // elegir hasta 18 desde presentes, priorizando los que menos jugaron hoy
    const pool = presentes.filter((id) => players.some((p) => p._id === id));
    const sorted = pool.sort((a, b) => (playedCounts[a] || 0) - (playedCounts[b] || 0));
    const picked = (priorizarNoJugados ? sorted : pool).slice(0, 18);
    setSelected(picked);
  };

  async function onCreate() {
    if (!competenciaId || !modalidad || !categoria) {
      setError('Faltan datos de competencia, modalidad o categoría');
      return;
    }
    setBusy(true); setError(null);
    try {
      const r = await createRankedMatch({ 
        modalidad: modalidad as any, 
        categoria: categoria as any, 
        creadoPor: 'org-ui', 
        competenciaId,
        temporadaId: selectedTemporada || undefined
      });
      setMatchId(r.partidoId);
      setRojo([]); setAzul([]);
    } catch (e: any) {
      setError(e.message || 'Error creando partido');
    } finally { setBusy(false); }
  }

  async function onAutoAssign() {
    if (!matchId) return;
    setBusy(true); setError(null);
    try {
      const r = await autoAssign(matchId, selected, true);
      setRojo(r.rojoPlayers); setAzul(r.azulPlayers);
    } catch (e: any) {
      setError(e.message || 'Error auto-asignando');
    } finally { setBusy(false); }
  }

  async function onSaveAssign() {
    if (!matchId) return;
    setBusy(true); setError(null);
    try {
      await assignTeams(matchId, rojo, azul);
      // incrementar conteo de jugados hoy
      const playedNow = new Set<string>([...rojo, ...azul]);
      setPlayedCounts((prev) => {
        const next = { ...prev };
        for (const id of playedNow) next[id] = (next[id] || 0) + 1;
        return next;
      });
    } catch (e: any) {
      setError(e.message || 'Error guardando equipos');
    } finally { setBusy(false); }
  }

  async function onFinalize() {
    if (!matchId) return;
    setBusy(true); setError(null);
    try {
      // como respaldo, marcar PJ hoy para los que jugaron (si no se hizo al guardar asignación)
      const playedNow = new Set<string>([...rojo, ...azul]);
      if (playedNow.size > 0) {
        setPlayedCounts((prev) => {
          const next = { ...prev };
          for (const id of playedNow) next[id] = (next[id] || 0) + 1;
          return next;
        });
      }
      await finalizeMatch(matchId, score.local, score.visitante);
      const lb = await getLeaderboard({ 
        modalidad: modalidad as string, 
        categoria: categoria as string, 
        competition: competenciaId, 
        season: selectedTemporada || undefined,
        limit: 20 
      });
      setBoard(lb.items);
      // listo este partido, habilitar crear otro
      setMatchId(null);
      setSelected([]);
      setRojo([]);
      setAzul([]);
      setScore({ local: 0, visitante: 0 });
    } catch (e: any) {
      setError(e.message || 'Error finalizando');
    } finally { setBusy(false); }
  }

  async function onMarkAsRanked() {
    if (!convertId.trim()) return;
    setBusy(true); setError(null);
    try {
      await markMatchAsRanked(convertId.trim());
      // no-op; user can now finalizar ese partido desde donde corresponda o usar esta vista para nuevos.
    } catch (e: any) {
      setError(e.message || 'Error marcando partido como ranked');
    } finally { setBusy(false); }
  }

  async function onAgregarJugadorCompetencia() {
    if (!competenciaId || !nuevoJugadorId.trim()) return;
    setBusy(true); setError(null);
    try {
      await crearJugadorCompetencia({ jugador: nuevoJugadorId.trim(), competencia: competenciaId });
      // refresh competencia players
      const items = await listJugadoresCompetencia(competenciaId);
      const mapped = items.map((jc) => {
        const j = jc.jugador as any;
        const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?._id || '';
        return { _id: (j?._id ?? j) as string, nombre };
      }).filter((p) => p._id);
      const seen = new Set<string>();
      const unique = mapped.filter((p) => (seen.has(p._id) ? false : (seen.add(p._id), true)));
      setCompPlayers(unique);
      setNuevoJugadorId('');
    } catch (e: any) {
      setError(e.message || 'Error agregando jugador a la competencia');
    } finally { setBusy(false); }
  }

  const nameById = (id: string) => players.find((p) => p._id === id)?.nombre || id;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {showAll && compPlayers.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          No hay jugadores registrados en esta competencia todavía. Mostrando todos los jugadores. Agrega jugadores a la competencia para usarlos en Ranked.
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500">Modalidad</label>
            <input value={modalidad} disabled className="w-40 cursor-not-allowed rounded-md border bg-slate-50 px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Categoría</label>
            <input value={categoria} disabled className="w-40 cursor-not-allowed rounded-md border bg-slate-50 px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Temporada</label>
            <select 
              value={selectedTemporada} 
              onChange={(e) => setSelectedTemporada(e.target.value)}
              className="w-40 rounded-md border bg-white px-2 py-1 text-sm"
              disabled={busy || !!matchId}
            >
              <option value="">Sin temporada</option>
              {temporadas.map(t => (
                <option key={t._id} value={t._id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <button onClick={onCreate} disabled={busy || !!matchId} className="rounded-md bg-brand-600 px-3 py-2 text-white disabled:opacity-50">Crear partido ranked</button>
          {matchId && (
            <>
              <span className="text-xs text-slate-500">Partido: {matchId}</span>
              <button
                type="button"
                onClick={() => { setMatchId(null); setSelected([]); setRojo([]); setAzul([]); setScore({ local: 0, visitante: 0 }); }}
                className="rounded-md border px-3 py-2 text-sm"
              >Nuevo partido</button>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Jugadores</h2>
              <div className="rounded border text-xs">
                <button type="button" className={`px-2 py-0.5 ${!showAll ? 'bg-slate-200' : ''}`} onClick={() => setShowAll(false)}>Solo competencia</button>
                <button type="button" className={`px-2 py-0.5 ${showAll ? 'bg-slate-200' : ''}`} onClick={() => setShowAll(true)}>Todos</button>
              </div>
            </div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar..." className="rounded-md border px-2 py-1 text-sm" />
          </div>
          <div className="h-80 overflow-auto rounded border">
            {filtered.map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-2 border-b px-2 py-1 text-sm">
                <label className="flex flex-1 items-center gap-2">
                  <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                  <span className="truncate">{p.nombre}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={presentes.includes(p._id)} onChange={(e)=> setPresentes(prev => e.target.checked ? [...new Set([...prev, p._id])] : prev.filter(x=>x!==p._id))} />
                    <span>Presente</span>
                    {presentes.includes(p._id) ? <span className="ml-1 text-slate-400">PJ hoy: {playedCounts[p._id] || 0}</span> : null}
                  </label>
                {showAll && !compPlayers.some(cp => cp._id === p._id) && (
                  <button
                    type="button"
                    className="shrink-0 rounded border px-2 py-0.5 text-xs"
                    onClick={async () => {
                      try {
                        await crearJugadorCompetencia({ jugador: p._id, competencia: competenciaId });
                        // refresh competencia players and exit fallback if any
                        const items = await listJugadoresCompetencia(competenciaId);
                        const mapped = items.map((jc) => {
                          const j = jc.jugador as any;
                          const nombre = [j?.nombre, j?.apellido].filter(Boolean).join(' ') || j?._id || '';
                          return { _id: (j?._id ?? j) as string, nombre };
                        }).filter((x) => x._id);
                        const seen = new Set<string>();
                        const unique = mapped.filter((x) => (seen.has(x._id) ? false : (seen.add(x._id), true)));
                        setCompPlayers(unique);
                      } catch (e: any) {
                        setError(e.message || 'Error agregando jugador');
                      }
                    }}
                  >Agregar</button>
                )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Seleccionados: {selected.length}</span>
              <button onClick={onAutoAssign} disabled={busy || !matchId || selected.length < 2} className="rounded-md border px-3 py-1 text-sm">Auto-assign balanceado</button>
            </div>
            <div className="flex gap-2">
              <button onClick={addToRojo} disabled={busy || selected.length === 0} className="rounded-md border px-3 py-1 text-sm">Añadir a Rojo</button>
              <button onClick={addToAzul} disabled={busy || selected.length === 0} className="rounded-md border px-3 py-1 text-sm">Añadir a Azul</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={nuevoJugadorId} onChange={(e)=>setNuevoJugadorId(e.target.value)} placeholder="ID del jugador para agregar a la competencia" className="flex-1 rounded-md border px-2 py-1 text-sm" />
              <button onClick={onAgregarJugadorCompetencia} disabled={busy || !nuevoJugadorId.trim()} className="rounded-md border px-3 py-1 text-sm">Agregar jugador a competencia</button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={priorizarNoJugados} onChange={(e)=>setPriorizarNoJugados(e.target.checked)} />
                  <span>Priorizar no jugados</span>
                </label>
                <button type="button" className="rounded-md border px-3 py-1 text-xs" onClick={chooseForNextMatch}>Elegir para próximo (max 18)</button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" className="rounded border px-2 py-0.5" onClick={()=>setPresentes(players.map(p=>p._id))}>Marcar todos</button>
                <button type="button" className="rounded border px-2 py-0.5" onClick={()=>setPresentes([])}>Limpiar presentes</button>
                <button type="button" className="rounded border px-2 py-0.5" onClick={()=>setPlayedCounts({})}>Reset PJ hoy</button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Rojo <span className="text-xs text-slate-500">({rojo.length}/9)</span></h2>
          <ul className="min-h-[6rem] space-y-1">
            {rojo.map((id) => (
              <li key={id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                <span>{nameById(id)}</span>
                <button type="button" className="text-xs text-slate-500 hover:text-rose-600" onClick={() => removeFromRojo(id)}>Quitar</button>
              </li>
            ))}
          </ul>
          <h2 className="mt-4 mb-2 text-sm font-semibold">Azul</h2>
          <ul className="min-h-[6rem] space-y-1">
            {azul.map((id) => (
              <li key={id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                <span>{nameById(id)}</span>
                <button type="button" className="text-xs text-slate-500 hover:text-rose-600" onClick={() => removeFromAzul(id)}>Quitar</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <button onClick={onSaveAssign} disabled={busy || !matchId} className="rounded-md border px-3 py-1 text-sm">Guardar asignación</button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Finalizar</h2>
          <div className="flex items-center gap-2">
            <input type="number" value={score.local} onChange={(e) => setScore((s) => ({ ...s, local: +e.target.value }))} className="w-20 rounded-md border px-2 py-1" />
            <span className="text-sm">-</span>
            <input type="number" value={score.visitante} onChange={(e) => setScore((s) => ({ ...s, visitante: +e.target.value }))} className="w-20 rounded-md border px-2 py-1" />
          </div>
          <button onClick={onFinalize} disabled={busy || !matchId} className="mt-3 rounded-md bg-emerald-600 px-3 py-2 text-white disabled:opacity-50">Aplicar resultado</button>
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Leaderboard de la competencia (top 20)</h3>
            <div className="mt-2 max-h-64 overflow-auto rounded border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs">
                    <th className="px-2 py-1">Jugador</th>
                    <th className="px-2 py-1">Rating</th>
                    <th className="px-2 py-1">PJ</th>
                    <th className="px-2 py-1">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((r) => (
                    <tr key={r.playerId} className="border-b">
                      <td className="px-2 py-1">{nameById(r.playerId)}</td>
                      <td className="px-2 py-1">{r.rating}</td>
                      <td className="px-2 py-1">{r.matchesPlayed}</td>
                      <td className="px-2 py-1">{r.lastDelta ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Convertir partido existente en ranked</h2>
        <div className="flex items-center gap-2">
          <input value={convertId} onChange={(e)=>setConvertId(e.target.value)} placeholder="ID de partido" className="flex-1 rounded-md border px-2 py-1 text-sm" />
          <button onClick={onMarkAsRanked} disabled={busy || !convertId.trim()} className="rounded-md border px-3 py-2 text-sm">Marcar como ranked</button>
        </div>
      </section>
    </div>
  );
}
