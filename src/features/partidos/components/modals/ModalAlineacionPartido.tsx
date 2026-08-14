import { useEffect, useMemo, useState } from 'react';
import  ModalBase  from '../../../../shared/components/ModalBase/ModalBase';
import { SelectorJugadores, EmbudoJugadores, type FilaSelector } from '../../../../shared/components/SelectorJugadores';
import { getAlineacion, crearJugadorPartido, eliminarJugadorPartido, actualizarJugadorPartido, getPartidoDetallado, getRankedMatchDetail } from '../../services/partidoService';
import { getJugadoresEquipo } from '../../../jugadores/services/jugadorEquipoService';
import { getFaseById } from '../../../competencias/services/fasesService';
import { listParticipacionesByTemporada } from '../../../competencias/services/participacionTemporadaService';
import { listJugadorTemporadaByParticipacion } from '../../../competencias/services/jugadorTemporadaService';
import { listParticipacionesByFase } from '../../../competencias/services/participacionFaseService';
import { listByParticipacionFase } from '../../../competencias/services/jugadorFaseService';
import type { Jugador, JugadorPartido } from '../../../../types';
import { useToast } from '../../../../shared/components/Toast/ToastProvider';

type RolPresente = 'jugador' | 'entrenador';

type JugadorOption = {
  id: string;
  nombre: string;
  numeroCamiseta?: number;
  jugadorTemporadaId?: string;
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

const normalizarRol = (r: unknown): RolPresente => (r === 'entrenador' ? 'entrenador' : 'jugador');

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
          // Preferir el plantel curado para ESTA fase (JugadorFase) por sobre la lista de buena fe
          // completa de la temporada — son casos reales distintos: un equipo puede tener 20
          // jugadores en la temporada pero solo 12 habilitados para una fase puntual. Si la
          // fase todavía no tiene ningún JugadorFase cargado (fases viejas, o una fase que el
          // organizador no curó todavía), cae al comportamiento anterior para no dejar el
          // selector vacío.
          try {
            const participacionesFase = await listParticipacionesByFase(faseId);
            const miParticipacionFase = participacionesFase.find((pf) => {
              const pt = pf.participacionTemporada as any;
              const ptId = typeof pt === 'string' ? pt : pt?._id;
              return ptId === miParticipacion._id;
            });
            if (miParticipacionFase) {
              const jugadoresFase = await listByParticipacionFase(miParticipacionFase._id);
              if (jugadoresFase.length > 0) {
                const opciones: JugadorOption[] = [];
                for (const jf of jugadoresFase) {
                  const jt = jf.jugadorTemporada as any;
                  const je = typeof jt === 'string' ? null : jt?.jugadorEquipo;
                  const j = je?.jugador;
                  if (!j) continue;
                  opciones.push({
                    id: j._id || j.id,
                    nombre: j.nombre || j.alias || 'Jugador',
                    numeroCamiseta: jt?.numeroCamiseta,
                    jugadorTemporadaId: typeof jt === 'string' ? jt : jt?._id,
                  });
                }
                return opciones;
              }
            }
          } catch (e) {
            console.warn('No se pudo resolver el plantel de la fase, uso el de la temporada', e);
          }

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
                numeroCamiseta: (jt as any).numeroCamiseta,
                jugadorTemporadaId: (jt as any)._id,
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

  // Estado editable en memoria: nada se persiste hasta apretar "Guardar cambios".
  const [presentes, setPresentes] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<Record<string, RolPresente>>({});
  const [jugadorPartidoPorJugador, setJugadorPartidoPorJugador] = useState<Record<string, string>>({});
  const [originales, setOriginales] = useState<{ presentes: Set<string>; roles: Record<string, RolPresente> }>({
    presentes: new Set(),
    roles: {},
  });
  const [lado, setLado] = useState<'local' | 'visitante'>('local');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        setBusqueda('');
        setLado('local');

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

        // Alguien puede estar en la alineación sin figurar entre los habilitados de la fase
        // (se cargó antes de curar la fase, o se lo quitó después): se muestra igual para que
        // el organizador lo vea y pueda sacarlo, en vez de que desaparezca en silencio.
        const extras = (targetEquipoId?: string, opciones: JugadorOption[] = []) =>
          alineacionActual
            .filter((item) => (typeof item.equipo === 'string' ? item.equipo === targetEquipoId : (item.equipo as any)?._id === targetEquipoId))
            .filter((item) => !opciones.some((op) => op.id === getJugadorId((item as any).jugador)))
            .map((item) => ({ id: getJugadorId((item as any).jugador), nombre: getJugadorNombre((item as any).jugador) }));

        if (!rankedFlag) {
          setJugadoresLocal([...opcionesLocal, ...extras(localId, opcionesLocal)]);
          setJugadoresVisitante([...opcionesVisitante, ...extras(visitanteId, opcionesVisitante)]);

          const presentesIniciales = new Set<string>();
          const rolesIniciales: Record<string, RolPresente> = {};
          const jpPorJugador: Record<string, string> = {};
          for (const item of alineacionActual) {
            const jugadorId = getJugadorId((item as any).jugador);
            if (!jugadorId) continue;
            presentesIniciales.add(jugadorId);
            rolesIniciales[jugadorId] = normalizarRol((item as any).rol);
            const jpId = (item as any)._id ?? (item as any).id;
            if (jpId) jpPorJugador[jugadorId] = jpId as string;
          }
          setPresentes(new Set(presentesIniciales));
          setRoles({ ...rolesIniciales });
          setJugadorPartidoPorJugador(jpPorJugador);
          setOriginales({ presentes: presentesIniciales, roles: rolesIniciales });
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

  const candidatos = lado === 'local' ? jugadoresLocal : jugadoresVisitante;
  const equipoActivoId = lado === 'local' ? equipoLocalId : equipoVisitanteId;

  const contarPresentes = (opciones: JugadorOption[]) => opciones.filter((o) => presentes.has(o.id)).length;

  const handleChangeRol = (jugadorId: string, rol: RolPresente) => {
    setRoles((prev) => ({ ...prev, [jugadorId]: rol }));
  };

  const toggle = (jugadorId: string) => {
    setPresentes((prev) => {
      const next = new Set(prev);
      if (next.has(jugadorId)) next.delete(jugadorId);
      else {
        next.add(jugadorId);
        setRoles((r) => (r[jugadorId] ? r : { ...r, [jugadorId]: 'jugador' }));
      }
      return next;
    });
  };

  const marcarTodos = (valor: boolean) => {
    setPresentes((prev) => {
      const next = new Set(prev);
      for (const op of candidatos) {
        if (valor) next.add(op.id);
        else next.delete(op.id);
      }
      return next;
    });
    if (valor) {
      setRoles((prev) => {
        const next = { ...prev };
        for (const op of candidatos) if (!next[op.id]) next[op.id] = 'jugador';
        return next;
      });
    }
  };

  const filas: FilaSelector[] = useMemo(
    () =>
      candidatos.map((op) => {
        const presente = presentes.has(op.id);
        return {
          id: op.id,
          nombre: op.numeroCamiseta != null ? `${op.numeroCamiseta}. ${op.nombre}` : op.nombre,
          checked: presente,
          extra: presente ? (
            <select
              value={roles[op.id] ?? 'jugador'}
              onChange={(e) => handleChangeRol(op.id, e.target.value as RolPresente)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-32"
            >
              <option value="jugador">Jugador</option>
              <option value="entrenador">Entrenador</option>
            </select>
          ) : undefined,
        };
      }),
    [candidatos, presentes, roles]
  );

  const cambios = useMemo(() => {
    const aAgregar: string[] = [];
    const aQuitar: string[] = [];
    const aActualizar: string[] = [];
    for (const id of Array.from(presentes)) {
      if (!originales.presentes.has(id)) aAgregar.push(id);
      else if ((roles[id] ?? 'jugador') !== (originales.roles[id] ?? 'jugador')) aActualizar.push(id);
    }
    for (const id of Array.from(originales.presentes)) {
      if (!presentes.has(id)) aQuitar.push(id);
    }
    return { aAgregar, aQuitar, aActualizar };
  }, [presentes, roles, originales]);

  const hayCambios = cambios.aAgregar.length + cambios.aQuitar.length + cambios.aActualizar.length > 0;

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setError(null);

      const equipoPorJugador: Record<string, string | undefined> = {};
      for (const op of jugadoresLocal) equipoPorJugador[op.id] = equipoLocalId;
      for (const op of jugadoresVisitante) equipoPorJugador[op.id] = equipoVisitanteId;
      const jtPorJugador: Record<string, string | undefined> = {};
      for (const op of [...jugadoresLocal, ...jugadoresVisitante]) jtPorJugador[op.id] = op.jugadorTemporadaId;

      const operaciones: Promise<unknown>[] = [
        ...cambios.aAgregar.map((jugadorId) =>
          crearJugadorPartido({
            partido: partidoId,
            jugador: jugadorId,
            equipo: equipoPorJugador[jugadorId] as string,
            jugadorTemporada: jtPorJugador[jugadorId],
            rol: roles[jugadorId] ?? 'jugador',
          })
        ),
        ...cambios.aQuitar
          .map((jugadorId) => jugadorPartidoPorJugador[jugadorId])
          .filter((jpId): jpId is string => !!jpId)
          .map((jpId) => eliminarJugadorPartido(jpId)),
        ...cambios.aActualizar
          .filter((jugadorId) => !!jugadorPartidoPorJugador[jugadorId])
          .map((jugadorId) =>
            actualizarJugadorPartido(jugadorPartidoPorJugador[jugadorId], { rol: roles[jugadorId] ?? 'jugador' })
          ),
      ];

      const resultados = await Promise.allSettled(operaciones);
      const fallidas = resultados.filter((r) => r.status === 'rejected').length;

      // Releemos para quedar sincronizados con lo que realmente quedó guardado, aunque alguna
      // operación haya fallado.
      const alineacionGuardada = await getAlineacion(partidoId);
      const presentesNuevos = new Set<string>();
      const rolesNuevos: Record<string, RolPresente> = {};
      const jpPorJugador: Record<string, string> = {};
      for (const item of alineacionGuardada) {
        const jugadorId = getJugadorId((item as any).jugador);
        if (!jugadorId) continue;
        presentesNuevos.add(jugadorId);
        rolesNuevos[jugadorId] = normalizarRol((item as any).rol);
        const jpId = (item as any)._id ?? (item as any).id;
        if (jpId) jpPorJugador[jugadorId] = jpId as string;
      }
      setPresentes(new Set(presentesNuevos));
      setRoles({ ...rolesNuevos });
      setJugadorPartidoPorJugador(jpPorJugador);
      setOriginales({ presentes: presentesNuevos, roles: rolesNuevos });

      onSaved?.(alineacionGuardada);

      if (fallidas > 0) {
        setError(`${fallidas} cambio${fallidas === 1 ? '' : 's'} no se pudo guardar. Revisá y reintentá.`);
        addToast({ type: 'error', title: 'Guardado parcial', message: `${fallidas} cambio(s) fallaron` });
      } else {
        addToast({ type: 'success', title: 'Alineación guardada', message: 'Los convocados fueron actualizados' });
        onClose();
      }
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

  const renderTabEquipo = (valor: 'local' | 'visitante', nombre: string, opciones: JugadorOption[]) => (
    <button
      key={valor}
      type="button"
      onClick={() => { setLado(valor); setBusqueda(''); }}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        lado === valor ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-200' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <span className="truncate">{nombre}</span>
      <span className={`ml-1.5 text-xs font-black ${lado === valor ? 'text-brand-600' : 'text-slate-400'}`}>
        {contarPresentes(opciones)}
      </span>
    </button>
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleCerrar}
      title={isRanked ? 'Alineación (Ranked)' : 'Convocados del partido'}
      subtitle={isRanked ? 'Jugadores asignados por ranked con rating Δ' : 'Marcá quiénes están presentes y su rol'}
      size="lg"
      bodyClassName="p-4 sm:p-5"
      footer={
        !isRanked ? (
          <div className="flex items-center justify-between gap-2 px-4 pb-1 sm:px-5">
            <span className="text-xs text-slate-400">
              {hayCambios
                ? `${cambios.aAgregar.length} alta(s) · ${cambios.aQuitar.length} baja(s) · ${cambios.aActualizar.length} cambio(s)`
                : 'Sin cambios'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCerrar}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleGuardar()}
                disabled={saving || loading || !hayCambios}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end px-4 pb-1 sm:px-5">
            <button
              type="button"
              onClick={handleCerrar}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Cerrar
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : !isRanked ? (
          <>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {renderTabEquipo('local', equipoLocalNombre, jugadoresLocal)}
              {renderTabEquipo('visitante', equipoVisitanteNombre, jugadoresVisitante)}
            </div>

            <EmbudoJugadores
              pasos={[
                { etiqueta: 'Habilitados en la fase', valor: candidatos.length },
                { etiqueta: 'Convocados', valor: contarPresentes(candidatos), activo: true },
              ]}
            />

            <SelectorJugadores
              filas={filas}
              onToggle={toggle}
              onMarcarTodos={marcarTodos}
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              etiquetaContador="convocados"
              vacioMensaje={
                equipoActivoId
                  ? 'Este equipo no tiene jugadores habilitados en esta fase. Cargalos desde Fase → Jugadores.'
                  : 'El partido todavía no tiene este equipo asignado.'
              }
            />
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(['rojo', 'azul'] as const).map((color) => (
              <div key={color} className="space-y-3">
                <h3 className="text-sm font-semibold capitalize text-slate-800">{color}</h3>
                {rankedTeams.find(t => t.color === color)?.players.length ? null : (
                  <p className="text-sm text-slate-500">Sin jugadores asignados.</p>
                )}
                {rankedTeams.find(t => t.color === color)?.players.map(p => {
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
            ))}
          </div>
        )}
      </div>
    </ModalBase>
  );
};

export default ModalAlineacionPartido;
