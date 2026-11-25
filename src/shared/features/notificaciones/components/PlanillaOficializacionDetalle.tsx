import React, { useEffect, useState } from 'react';
import {
  getRevisionPlanilla,
  nombreDeJugador,
  totalesPlanilla,
  totalesOficiales,
  type EstadoTraspaso,
  type RevisionPlanilla,
} from '../../solicitudes/services/planillaRevisionService';
import ReconciliacionPartidoModal from '../../solicitudes/components/ReconciliacionPartidoModal';
import { getSeleccion, setSeleccion } from './SeleccionAprobacion';

/**
 * Lo que ve el organizador antes de aprobar la oficialización de una planilla.
 *
 * Aprobar sin ver la comparación es peor que no tener la función: el organizador
 * estaría adoptando números que nunca miró. Acá se muestra, jugador por jugador, qué
 * dice la planilla del equipo contra qué hay hoy en el registro oficial, y qué
 * estructura (sets, convocatoria) se va a crear si aprueba.
 */

interface Props {
  planillaId: string;
  /**
   * Si viene (solicitud pendiente), el visor deja elegir qué incorporar: jugadores, sets y qué
   * sets existentes toman el resultado de la planilla. La elección la lee el botón Aprobar.
   */
  solicitudId?: string;
  /**
   * Qué pidió el equipo: 'estructura' = sólo sets (tiempo, ganador), alineaciones, marcas y
   * video, sin jugadores; 'completa' = además convocatoria y estadísticas. Con 'estructura' el
   * backend no incorpora jugadores aunque se aprueben (utils/seleccionAprobacion.js).
   */
  alcance?: 'completa' | 'estructura';
}

type Totales = { throws: number; hits: number; outs: number; catches: number };

const CAMPOS: Array<keyof Totales> = ['throws', 'hits', 'outs', 'catches'];

const VACIO: Totales = { throws: 0, hits: 0, outs: 0, catches: 0 };

const SELECCION_VACIA = { presentes: null as Set<string> | null, incluirSets: true, pisar: new Set<number>() };

const PlanillaOficializacionDetalle: React.FC<Props> = ({ planillaId, solicitudId, alcance = 'completa' }) => {
  const soloEstructura = alcance === 'estructura';
  // presentes: null = todos (lo mismo que no haber tocado nada).
  const [sel, setSel] = useState(() => {
    const previa = solicitudId ? getSeleccion(solicitudId) : undefined;
    if (!previa) return SELECCION_VACIA;
    return {
      presentes: Array.isArray(previa.presentes) ? new Set(previa.presentes as string[]) : null,
      incluirSets: previa.sets !== false,
      pisar: new Set(Array.isArray(previa.pisarSets) ? (previa.pisarSets as number[]) : []),
    };
  });
  const [revision, setRevision] = useState<RevisionPlanilla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconciliando, setReconciliando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const cargar = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRevisionPlanilla(planillaId);
        if (!cancelado) setRevision(data);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar la planilla');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [planillaId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando la planilla del equipo…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (!revision) return null;

  const { planilla, oficial, equiposDelPartido, captura } = revision;
  const dePlanilla = totalesPlanilla(planilla);
  const deOficial = totalesOficiales(revision);

  const setsNuevos = planilla.sets.filter((s) => !s.setPartido).length;
  const presentesNuevos = planilla.presentes.filter((p) => !p.jugadorPartido).length;
  const equipoDueñoId = typeof planilla.equipo === 'object' ? planilla.equipo._id : planilla.equipo;
  const equipoNombre =
    typeof planilla.equipo === 'object' ? planilla.equipo.nombre ?? 'el equipo' : 'el equipo';

  const nombrePorEquipoId = new Map((equiposDelPartido ?? []).map((eq) => [eq._id, eq.nombre ?? 'Equipo']));
  const idEquipoDePresente = (p: (typeof planilla.presentes)[number]): string | undefined =>
    typeof p.equipo === 'object' ? p.equipo?._id : p.equipo;
  // Presentes de un equipo que no es el dueño de la planilla: es lo que aparece cuando el equipo
  // cargó también al rival, o cuando la planilla es de scouting y ninguno de los dos es "suyo".
  const hayPresentesDeOtroEquipo = planilla.presentes.some((p) => {
    const idEq = idEquipoDePresente(p);
    return idEq && idEq !== equipoDueñoId;
  });
  const equipoDueñoJuega = !equiposDelPartido?.length || equiposDelPartido.some((eq) => eq._id === equipoDueñoId);

  // ── Selección ──────────────────────────────────────────────────────────────
  const editable = Boolean(solicitudId);
  const todosIds = planilla.presentes.map((p) => p._id);
  const elegido = (id: string) => sel.presentes === null || sel.presentes.has(id);
  const oficialPorNumero = new Map(oficial.sets.map((x) => [x.numeroSet, x.ganadorSet]));
  // Sets que el partido ya tiene con otro resultado (o sin ganador) y la planilla sí trae uno.
  const setsEnConflicto = planilla.sets.filter(
    (x) => oficialPorNumero.has(x.numeroSet) && x.ganadorSet !== 'pendiente' && oficialPorNumero.get(x.numeroSet) !== x.ganadorSet,
  );
  const guardar = (next: typeof sel) => {
    setSel(next);
    if (!solicitudId) return;
    const todos = next.presentes === null || next.presentes.size === todosIds.length;
    const esTodo = todos && next.incluirSets && next.pisar.size === 0;
    setSeleccion(
      solicitudId,
      esTodo
        ? null
        : {
            presentes: next.presentes === null ? todosIds : [...next.presentes],
            sets: next.incluirSets,
            pisarSets: [...next.pisar],
          },
    );
  };
  const togglePresente = (id: string, v: boolean) => {
    const base = new Set(sel.presentes ?? todosIds);
    if (v) base.add(id);
    else base.delete(id);
    guardar({ ...sel, presentes: base });
  };
  const togglePisar = (n: number, v: boolean) => {
    const base = new Set(sel.pisar);
    if (v) base.add(n);
    else base.delete(n);
    guardar({ ...sel, pisar: base });
  };
  const nombreGanador = (g: string) =>
    g === 'local' ? 'local' : g === 'visitante' ? 'visitante' : g === 'empate' ? 'empate' : 'sin ganador';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">{equipoNombre}</span> cargó esta planilla por su cuenta.
          Nada de esto está todavía en el registro oficial.
          {!equipoDueñoJuega && (
            <span className="mt-1 block text-xs text-slate-500">
              {equipoNombre} no jugó este partido — es una planilla de scouting sobre un partido
              ajeno.
            </span>
          )}
          {hayPresentesDeOtroEquipo && equipoDueñoJuega && (
            <span className="mt-1 block text-xs text-slate-500">
              Incluye jugadores del otro equipo, cargados por {equipoNombre}.
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Modo {planilla.modo === 'sets' ? 'set a set' : 'totales del partido'} ·{' '}
          {planilla.presentes.length} jugador{planilla.presentes.length === 1 ? '' : 'es'} ·{' '}
          {planilla.sets.length} set{planilla.sets.length === 1 ? '' : 's'} · visibilidad al aprobar:{' '}
          {planilla.visibilidadObjetivo === 'publica' ? 'pública' : 'solo organización'}
        </p>
        {/* Aprobar esta planilla sola esconde si el otro equipo mandó una distinta: desde acá
            se ven todas las versiones del partido juntas y se elige cuál manda por equipo. */}
        <button
          type="button"
          onClick={() => setReconciliando(true)}
          className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-800"
        >
          Comparar con todas las versiones del partido y reconciliar →
        </button>
      </div>

      <ReconciliacionPartidoModal
        partidoId={String(planilla.partido)}
        isOpen={reconciliando}
        onClose={() => setReconciliando(false)}
      />

      {(setsNuevos > 0 || (!soloEstructura && presentesNuevos > 0)) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">Si aprobás, se crea estructura nueva en el partido</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
            {!soloEstructura && presentesNuevos > 0 && (
              <li>
                {presentesNuevos} jugador{presentesNuevos === 1 ? '' : 'es'} que hoy no está
                {presentesNuevos === 1 ? '' : 'n'} en la convocatoria oficial.
              </li>
            )}
            {setsNuevos > 0 && (
              <li>
                {setsNuevos} set{setsNuevos === 1 ? '' : 's'} que hoy no existe
                {setsNuevos === 1 ? '' : 'n'} en el partido.
              </li>
            )}
          </ul>
          <p className="mt-1.5 text-xs">
            Los sets y jugadores que ya existen no se tocan: se reutilizan tal como están, incluido
            el resultado de cada set, salvo los sets que marques abajo para tomar el resultado de la
            planilla.
          </p>
        </div>
      )}

      {soloEstructura ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          El equipo pidió oficializar <b>sólo el partido</b>: sets con su tiempo y ganador, alineaciones,
          marcas y video. Las estadísticas de jugadores no entran aunque la planilla las tenga.
        </p>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-2xs font-bold uppercase tracking-wide text-muted">
                {editable && (
                  <th className="w-8 pb-2 pr-2">
                    <span className="sr-only">Incorporar</span>
                  </th>
                )}
                <th className="pb-2 pr-3">Jugador</th>
                {hayPresentesDeOtroEquipo && <th className="pb-2 pr-3">Equipo</th>}
                {CAMPOS.map((campo) => (
                  <th key={campo} className="pb-2 pr-3 text-right">
                    {campo}
                  </th>
                ))}
                <th className="pb-2 text-right">Hoy oficial</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {planilla.presentes.map((presente) => {
                const propuesto = dePlanilla[presente._id] ?? VACIO;
                const actual = presente.jugadorPartido
                  ? deOficial[String(presente.jugadorPartido)]
                  : undefined;
  
                const difiere =
                  actual !== undefined && CAMPOS.some((c) => actual[c] !== propuesto[c]);
  
                return (
                  <tr
                    key={presente._id}
                    className={`border-b border-slate-100 last:border-0 ${editable && !elegido(presente._id) ? 'opacity-50' : ''}`}
                  >
                    {editable && (
                      <td className="py-1.5 pr-2">
                        <input
                          type="checkbox"
                          checked={elegido(presente._id)}
                          onChange={(e) => togglePresente(presente._id, e.target.checked)}
                          aria-label={`Incorporar a ${nombreDeJugador(presente.jugador)}`}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}
                    <td className="py-1.5 pr-3 text-slate-800">
                      {nombreDeJugador(presente.jugador)}
                      {!presente.jugadorPartido && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-700">
                          Alta nueva
                        </span>
                      )}
                    </td>
                    {hayPresentesDeOtroEquipo && (
                      <td className="py-1.5 pr-3 text-xs text-slate-500">
                        {nombrePorEquipoId.get(idEquipoDePresente(presente) ?? '') ?? '—'}
                      </td>
                    )}
                    {CAMPOS.map((campo) => (
                      <td
                        key={campo}
                        className={`py-1.5 pr-3 text-right ${
                          actual !== undefined && actual[campo] !== propuesto[campo]
                            ? 'font-semibold text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {propuesto[campo]}
                      </td>
                    ))}
                    <td className="py-1.5 text-right text-xs text-muted">
                      {actual === undefined
                        ? '—'
                        : difiere
                          ? CAMPOS.map((c) => actual[c]).join(' / ')
                          : 'igual'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
  
        <p className="text-xs text-slate-500">
          La columna «Hoy oficial» muestra los totales que ya tiene el registro de la competencia,
          en el mismo orden que las columnas. Un «—» significa que ese jugador todavía no tiene
          estadísticas oficiales en este partido.
        </p>
          </>
      )}

      {editable && planilla.modo === 'sets' && planilla.sets.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <p className="text-2xs font-bold uppercase tracking-wide text-muted">Sets</p>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={sel.incluirSets}
              onChange={(e) => guardar({ ...sel, incluirSets: e.target.checked, pisar: e.target.checked ? sel.pisar : new Set() })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Incorporar los sets de la planilla
              {setsNuevos > 0 ? <> (se crean los {setsNuevos} que el partido no tiene, con su resultado)</> : null}.
              <span className="block text-xs text-slate-500">
                Si lo destildás, las estadísticas se cargan sólo en los sets que el partido ya tiene.
              </span>
            </span>
          </label>
          {sel.incluirSets && setsEnConflicto.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <p className="mb-1 text-xs text-slate-600">
                Estos sets ya existen con otro resultado. Marcá los que deben tomar el de la planilla:
              </p>
              {setsEnConflicto.map((x) => (
                <label key={x.numeroSet} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={sel.pisar.has(x.numeroSet)}
                    onChange={(e) => togglePisar(x.numeroSet, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Set {x.numeroSet}: hoy <b>{nombreGanador(oficialPorNumero.get(x.numeroSet) ?? '')}</b> → planilla{' '}
                    <b>{nombreGanador(x.ganadorSet)}</b>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {captura && (captura.camarasNuevas.length > 0 || captura.sets.length > 0) && (
        <CapturaAlAprobar captura={captura} incluirSets={sel.incluirSets} />
      )}

      {oficial.sets.length > 0 && (
        <p className="text-xs text-slate-500">
          El partido ya tiene {oficial.sets.length} set{oficial.sets.length === 1 ? '' : 's'}{' '}
          cargado{oficial.sets.length === 1 ? '' : 's'} por la organización.
        </p>
      )}
    </div>
  );
};

const ETIQUETA: Record<'pasa' | 'ya_tiene' | 'reloj', { texto: string; clase: string }> = {
  pasa: { texto: 'pasa', clase: 'text-emerald-700' },
  ya_tiene: { texto: 'ya tiene, no se pisa', clase: 'text-muted' },
  reloj: { texto: 'no pasa (reloj)', clase: 'text-amber-700' },
};

/** Video, tiempos y marcas: qué pasa al partido si se aprueba. */
const CapturaAlAprobar: React.FC<{ captura: NonNullable<RevisionPlanilla['captura']>; incluirSets: boolean }> = ({
  captura,
  incluirSets,
}) => {
  const celda = (estado: EstadoTraspaso, texto?: string) => {
    if (!estado) return <span className="text-muted">—</span>;
    // Sin sets incorporados, el traspaso de tiempos/marcas/alineación no corre.
    const e = !incluirSets ? null : ETIQUETA[estado];
    if (!e) return <span className="text-muted">no pasa (sets destildados)</span>;
    return <span className={e.clase}>{texto && estado === 'pasa' ? texto : e.texto}</span>;
  };
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-2xs font-bold uppercase tracking-wide text-muted">Video y marcas</p>
      {captura.camarasNuevas.length > 0 && (
        <p className="text-sm text-slate-700">
          Se suma{captura.camarasNuevas.length === 1 ? '' : 'n'} {captura.camarasNuevas.length} cámara
          {captura.camarasNuevas.length === 1 ? '' : 's'} al partido:{' '}
          {captura.camarasNuevas.map((c) => c.etiqueta || c.youtubeId).join(', ')}.
        </p>
      )}
      {captura.relojesDistintos && (
        <p className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          Las cámaras de la planilla están alineadas distinto que las del partido: sus tiempos y marcas
          caerían en otro momento del video, así que no se trasladan. Las cámaras nuevas y la alineación sí.
        </p>
      )}
      {captura.sets.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-2xs font-bold uppercase tracking-wide text-muted">
              <th className="pb-1 pr-3">Set</th>
              <th className="pb-1 pr-3">Tiempo</th>
              <th className="pb-1 pr-3">Alineación</th>
              <th className="pb-1">Marcas</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {captura.sets.map((x) => (
              <tr key={x.numeroSet} className="border-b border-slate-100 last:border-0">
                <td className="py-1 pr-3 text-sm text-slate-800">{x.numeroSet}</td>
                <td className="py-1 pr-3">{celda(x.tiempo)}</td>
                <td className="py-1 pr-3">{celda(x.alineacion)}</td>
                <td className="py-1">{celda(x.marcasEstado, `pasan ${x.marcas}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PlanillaOficializacionDetalle;
