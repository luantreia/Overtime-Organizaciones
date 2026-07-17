import { useEffect, useMemo, useState } from 'react';
import  ModalBase  from '../../../../shared/components/ModalBase/ModalBase';
import { getAlineacion, guardarAlineacion, crearJugadorPartido, eliminarJugadorPartido, getPartidoDetallado, getRankedMatchDetail } from '../../services/partidoService';
import { getJugadoresEquipo } from '../../../jugadores/services/jugadorEquipoService';
import { getFaseById } from '../../../competencias/services/fasesService';
import { listParticipacionesByTemporada } from '../../../competencias/services/participacionTemporadaService';
import { listJugadorTemporadaByParticipacion } from '../../../competencias/services/jugadorTemporadaService';
import type { Jugador, JugadorPartido } from '../../../../types';
import { useToast } from '../../../../shared/components/Toast/ToastProvider';

type RolAlineacion = 'jugador' | 'entrenador' | 'ninguno';

type JugadorOption = {
  id: string;
  nombre: string;
  numeroCamiseta?: number;
};

type ModalAlineacionPartidoProps = {
  partidoId: string;
  equipoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (jugadores: JugadorPartido[]) => void;
};

const getJugadorId = (jugador: unknown): string => {
  if (!jugador) return '';
  if (typeof jugador === 'string') return jugador;
  const j = jugador as { id?: string; _id?: string };
  return j.id ?? j._id ?? '';
};

const getJugadorNombre = (jugador: unknown): string => {
  if (!jugador) return 'Jugador';
  if (typeof jugador === 'string') return 'Jugador';
  const j = jugador as { nombre?: string; alias?: string };
  return j.nombre ?? j.alias ?? 'Jugador';
};

const mapJugadorOption = (jugador: Jugador): JugadorOption => ({
  id: jugador.id,
  nombre: jugador.nombre,
  numeroCamiseta: jugador.numeroCamiseta,
});

const buildInitialRoles = (alineacion: JugadorPartido[]): Record<string, RolAlineacion> => {
  const roles: Record<string, RolAlineacion> = {};
  const normalize = (r: unknown): RolAlineacion => (r === 'entrenador' ? 'entrenador' : r === 'jugador' ? 'jugador' : 'jugador');
  alineacion.forEach((item) => {
    const jid = getJugadorId((item as any).jugador);
    if (jid) roles[jid] = normalize((item as any).rol);
  });
  return roles;
};

const isRolAsignable = (rol: RolAlineacion): rol is Exclude<RolAlineacion, 'ninguno'> =>
  rol === 'jugador' || rol === 'entrenador';

// Helper para obtener jugadores elegibles (contrato activo o inscritos en temporada)
const getJugadoresElegibles = async (equipoId: string, partido: any): Promise<JugadorOption[]> => {
  if (!equipoId) return [];
  
  // Si el partido tiene fase, intentamos buscar jugadores inscritos en la temporada
  if (partido.fase) {
    try {
      const faseId =
        typeof partido.fase === 'string'
          ? partido.fase
          : partido.fase?._id || partido.fase?.id;

      if (!faseId) return [];

      const fase = await getFaseById(faseId);
      if (fase && fase.temporada) {
        const participaciones = await listParticipacionesByTemporada(fase.temporada);
        const miParticipacion = participaciones.find(p => 
          (typeof p.equipo === 'string' ? p.equipo : p.equipo._id) === equipoId
        );
        
        if (miParticipacion) {
          const jugadoresTemp = await listJugadorTemporadaByParticipacion(miParticipacion._id);
          // Algunos registros pueden tener jugadorEquipo huérfano (el contrato fue borrado pero
          // la referencia quedó) — se descartan en vez de dejar que un solo registro roto tire
          // todo el resultado al catch de más abajo.
          return jugadoresTemp
            .filter(jt => {
              const je = jt.jugadorEquipo as any;
              if (!je || !je.jugador) {
                console.warn('JugadorTemporada con jugadorEquipo huérfano, se omite:', (jt as any)._id);
                return false;
              }
              return true;
            })
            .map(jt => {
              const je = jt.jugadorEquipo as any;
              const j = je.jugador;
              return {
                id: j._id || j.id,
                nombre: j.nombre || j.alias || 'Jugador',
                numeroCamiseta: (jt as any).numeroCamiseta
              };
            });
        }
      }
    } catch (e) {
      console.error("Error fetching competition players, falling back to active contracts", e);
    }
  }
  
  // Fallback: jugadores con contrato aceptado (JugadorEquipo.estado solo admite 'aceptado' | 'baja')
  const response = await getJugadoresEquipo({
    equipoId,
    estado: 'aceptado'
  });

  const jugadores = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.jugadores)
      ? (response as any).jugadores
      : Array.isArray((response as any)?.docs)
        ? (response as any).docs
        : [];

  return jugadores.map(mapJugadorOption);
};

export const ModalAlineacionPartido = ({
  partidoId,
  equipoId,
  isOpen,
  onClose,
  onSaved,
}: ModalAlineacionPartidoProps) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jugadoresLocal, setJugadoresLocal] = useState<JugadorOption[]>([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState<JugadorOption[]>([]);
  const [equipoLocalId, setEquipoLocalId] = useState<string | undefined>(undefined);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState<string | undefined>(undefined);
  const [equipoLocalNombre, setEquipoLocalNombre] = useState<string>('Equipo Local');
  const [equipoVisitanteNombre, setEquipoVisitanteNombre] = useState<string>('Equipo Visitante');
  const [isRanked, setIsRanked] = useState<boolean>(false);
  const [rankedTeams, setRankedTeams] = useState<Array<{ color: 'rojo' | 'azul'; players: Array<{ id: string; nombre: string }> }>>([]);
  const [rankedPlayers, setRankedPlayers] = useState<Array<{ id: string; nombre: string; pre?: number; post?: number; delta?: number; color?: 'rojo' | 'azul' | null }>>([]);
  const [rolesPorJugador, setRolesPorJugador] = useState<Record<string, RolAlineacion>>({});
  const [jugadorPartidoPorJugador, setJugadorPartidoPorJugador] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const partido = await getPartidoDetallado(partidoId);
        const localId = (typeof partido.equipoLocal === 'string') ? partido.equipoLocal : partido.equipoLocal?._id;
        const visitanteId = (typeof partido.equipoVisitante === 'string') ? partido.equipoVisitante : partido.equipoVisitante?._id;

        const equipoLocalNombre = (typeof partido.equipoLocal === 'string') ? 'Local' : (partido.equipoLocal?.nombre ?? 'Local');
        const equipoVisitanteNombre = (typeof partido.equipoVisitante === 'string') ? 'Visitante' : (partido.equipoVisitante?.nombre ?? 'Visitante');

        let alineacionActual: JugadorPartido[] = [];
        let jugadoresEquipoLocal: JugadorOption[] = [];
        let jugadoresEquipoVisitante: JugadorOption[] = [];

        // Detect ranked and branch data source
        const rankedFlag = (partido as any).isRanked === true;
        setIsRanked(rankedFlag);
        if (rankedFlag) {
          const ranked = await getRankedMatchDetail(partidoId);
          const teams = Array.isArray(ranked.teams) ? ranked.teams : [];
          const players = Array.isArray(ranked.players) ? ranked.players : [];
          const normalizeName = (p: any): { id: string; nombre: string } => {
            if (!p) return { id: '', nombre: 'Jugador' };
            if (typeof p === 'string') return { id: p, nombre: 'Jugador' };
            return { id: p._id, nombre: p.nombre ?? p.alias ?? 'Jugador' };
          };
          setRankedTeams(teams.map(t => ({
            color: t.color,
            players: (t.players || []).map(normalizeName).filter(x => x.id),
          })));
          setRankedPlayers(players.map(mp => ({
            id: typeof mp.playerId === 'string' ? mp.playerId : (mp.playerId?._id ?? ''),
            nombre: typeof mp.playerId === 'string' ? 'Jugador' : (mp.playerId?.nombre ?? mp.playerId?.alias ?? 'Jugador'),
            pre: mp.preRating,
            post: mp.postRating,
            delta: mp.delta,
            color: mp.teamColor ?? null,
          })).filter(x => x.id));
        } else {
          [alineacionActual, jugadoresEquipoLocal, jugadoresEquipoVisitante] = await Promise.all([
            getAlineacion(partidoId),
            localId ? getJugadoresElegibles(localId, partido) : Promise.resolve([] as JugadorOption[]),
            visitanteId ? getJugadoresElegibles(visitanteId, partido) : Promise.resolve([] as JugadorOption[]),
          ]);
        }

        if (!isActive) return;

        setEquipoLocalId(localId);
        setEquipoVisitanteId(visitanteId);
        setEquipoLocalNombre(equipoLocalNombre);
        setEquipoVisitanteNombre(equipoVisitanteNombre);

        const opcionesLocal = jugadoresEquipoLocal;
        const opcionesVisitante = jugadoresEquipoVisitante;

        const extrasLocal = alineacionActual
          .filter((item) => (typeof item.equipo === 'string' ? item.equipo === localId : (item.equipo as any)?._id === localId))
          .filter((item) => !opcionesLocal.some((op) => op.id === getJugadorId((item as any).jugador)))
          .map((item) => ({ id: getJugadorId((item as any).jugador), nombre: getJugadorNombre((item as any).jugador) }));

        const extrasVisitante = alineacionActual
          .filter((item) => (typeof item.equipo === 'string' ? item.equipo === visitanteId : (item.equipo as any)?._id === visitanteId))
          .filter((item) => !opcionesVisitante.some((op) => op.id === getJugadorId((item as any).jugador)))
          .map((item) => ({ id: getJugadorId((item as any).jugador), nombre: getJugadorNombre((item as any).jugador) }));

        if (!rankedFlag) {
          setJugadoresLocal([...opcionesLocal, ...extrasLocal]);
          setJugadoresVisitante([...opcionesVisitante, ...extrasVisitante]);
          setRolesPorJugador(buildInitialRoles(alineacionActual));
          setJugadorPartidoPorJugador(
            alineacionActual.reduce<Record<string, string>>((acc, it) => {
              const jpId = (it as any)._id ?? (it as any).id;
              const jugadorId = getJugadorId((it as any).jugador);
              if (jpId && jugadorId) acc[jugadorId] = jpId as string;
              return acc;
            }, {})
          );
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Error al cargar alineación:', err);
        setError('No pudimos cargar la alineación. Intentá nuevamente.');
        addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar la alineación' });
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void cargar();

    return () => {
      isActive = false;
    };
  }, [equipoId, isOpen, partidoId, addToast]);

  const handleChangeRol = (jugadorId: string, rol: RolAlineacion) => {
    setRolesPorJugador((prev) => ({
      ...prev,
      [jugadorId]: rol,
    }));
  };

  // Contado por jugadorId único en rolesPorJugador (no por las listas de elegibles concatenadas,
  // que pueden repetir un mismo jugador si aparece como candidato de ambos equipos).
  const jugadoresConRolCount = useMemo(
    () => Object.values(rolesPorJugador).filter((rol) => isRolAsignable(rol)).length,
    [rolesPorJugador],
  );

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setError(null);

      const jugadoresPayload = Object.entries(rolesPorJugador).reduce(
        (acc, [jugadorId, rol]) => {
          if (isRolAsignable(rol)) {
            acc.push({ jugadorId, rol });
          }
          return acc;
        },
        [] as { jugadorId: string; rol: Exclude<RolAlineacion, 'ninguno'> }[],
      );

      const alineacionGuardada = await guardarAlineacion(partidoId, { jugadores: jugadoresPayload });
      onSaved?.(alineacionGuardada);
      addToast({ type: 'success', title: 'Alineación guardada', message: 'Los roles fueron actualizados' });
      onClose();
    } catch (err) {
      console.error('Error al guardar alineación:', err);
      setError('No pudimos guardar la alineación. Revisá los datos e intentá nuevamente.');
      addToast({ type: 'error', title: 'Error', message: 'No pudimos guardar la alineación' });
    } finally {
      setSaving(false);
    }
  };

  const handleCerrar = () => {
    if (!saving) {
      onClose();
    }
  };

  const handleTogglePresente = async (jugador: JugadorOption, targetEquipoId: string | undefined, presente: boolean) => {
    if (presente) {
      if (!targetEquipoId) return;
      try {
        const creado = await crearJugadorPartido({ partido: partidoId, jugador: jugador.id, equipo: targetEquipoId });
        setJugadorPartidoPorJugador((prev) => ({ ...prev, [jugador.id]: creado._id }));
        setRolesPorJugador((prev) => ({
          ...prev,
          [jugador.id]: isRolAsignable(prev[jugador.id]) ? prev[jugador.id] : 'jugador',
        }));
      } catch (err) {
        console.error('Error al agregar jugador al partido:', err);
        addToast({ type: 'error', title: 'Error', message: 'No pudimos agregar el jugador' });
      }
    } else {
      await handleQuitarJugador(jugador.id);
    }
  };

  const handleQuitarJugador = async (jugadorId: string) => {
    const jpId = jugadorPartidoPorJugador[jugadorId];
    if (!jpId) return;
    try {
      await eliminarJugadorPartido(jpId);
      setJugadorPartidoPorJugador((prev) => {
        const next = { ...prev };
        delete next[jugadorId];
        return next;
      });
      setRolesPorJugador((prev) => ({ ...prev, [jugadorId]: 'ninguno' }));
      addToast({ type: 'success', title: 'Quitado', message: 'Jugador removido del partido' });
    } catch (err) {
      console.error('Error al quitar jugador del partido:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos quitar el jugador' });
    }
  };

  const renderChecklist = (nombreEquipo: string, roster: JugadorOption[], targetEquipoId: string | undefined) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">{nombreEquipo}</h3>
      {roster.length === 0 ? (
        <p className="text-sm text-slate-500">No hay jugadores en la lista de buena fe de esta temporada.</p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {roster.map((j) => {
            const presente = !!jugadorPartidoPorJugador[j.id];
            const rol = rolesPorJugador[j.id];
            return (
              <label key={j.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={presente}
                  onChange={(e) => void handleTogglePresente(j, targetEquipoId, e.target.checked)}
                  className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`flex-1 min-w-0 truncate text-sm ${presente ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {j.nombre}
                </span>
                {presente && (
                  <select
                    value={isRolAsignable(rol) ? rol : 'jugador'}
                    onChange={(e) => handleChangeRol(j.id, e.target.value as RolAlineacion)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-32 flex-shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="jugador">Jugador</option>
                    <option value="entrenador">Entrenador</option>
                  </select>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleCerrar}
      title={isRanked ? 'Alineación (Ranked)' : 'Gestionar jugadores del partido'}
      subtitle={isRanked ? 'Jugadores asignados por ranked con rating Δ' : 'Marcá quiénes están presentes y su rol'}
      size="lg"
      bodyClassName="p-0"
    >
      <div className="space-y-6 p-6">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : (
          <>
            {!isRanked ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>Marcá quiénes están presentes en el partido. Podés cambiar el rol de cada uno.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>Vista de alineación ranked. Muestra Rojo/Azul y cambios de rating.</p>
              </div>
            )}

            {!isRanked ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {renderChecklist(equipoLocalNombre, jugadoresLocal, equipoLocalId)}
                {renderChecklist(equipoVisitanteNombre, jugadoresVisitante, equipoVisitanteId)}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Rojo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Rojo</h3>
                  {rankedTeams.find(t => t.color === 'rojo')?.players.length ? null : (
                    <p className="text-sm text-slate-500">Sin jugadores asignados.</p>
                  )}
                  {rankedTeams.find(t => t.color === 'rojo')?.players.map(p => {
                    const snap = rankedPlayers.find(rp => rp.id === p.id);
                    return (
                      <div key={p.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="min-w-0 w-1/2 pr-2">
                          <p className="text-sm font-medium text-slate-900 whitespace-normal">{p.nombre}</p>
                        </div>
                        <div className="flex w-1/2 flex-wrap items-center justify-end gap-2">
                          {snap ? (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${snap.delta && snap.delta > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : snap.delta && snap.delta < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                              {snap.pre ?? '—'} → {snap.post ?? '—'} ({(snap.delta ?? 0) >= 0 ? '+' : ''}{snap.delta ?? 0})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Sin datos de rating</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Azul */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Azul</h3>
                  {rankedTeams.find(t => t.color === 'azul')?.players.length ? null : (
                    <p className="text-sm text-slate-500">Sin jugadores asignados.</p>
                  )}
                  {rankedTeams.find(t => t.color === 'azul')?.players.map(p => {
                    const snap = rankedPlayers.find(rp => rp.id === p.id);
                    return (
                      <div key={p.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="min-w-0 w-1/2 pr-2">
                          <p className="text-sm font-medium text-slate-900 whitespace-normal">{p.nombre}</p>
                        </div>
                        <div className="flex w-1/2 flex-wrap items-center justify-end gap-2">
                          {snap ? (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${snap.delta && snap.delta > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : snap.delta && snap.delta < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                              {snap.pre ?? '—'} → {snap.post ?? '—'} ({(snap.delta ?? 0) >= 0 ? '+' : ''}{snap.delta ?? 0})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Sin datos de rating</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isRanked && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p className="font-medium text-slate-900">Resumen</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Jugadores asignados: {jugadoresConRolCount}</li>
                </ul>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCerrar}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          {!isRanked && (
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving || loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalAlineacionPartido;
