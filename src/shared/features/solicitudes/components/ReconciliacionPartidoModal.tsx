import React, { useEffect, useMemo, useState } from 'react';
import { Button, Overlay } from 'overtime-kit';
import {
  FUENTE_OFICIAL,
  getReconciliacion,
  publicarReconciliacion,
  type ConfirmacionRequerida,
  type FilaJugadorReconciliacion,
  type FuenteReconciliacion,
  type Reconciliacion,
  type ResultadoPublicacion,
  type Totales,
} from '../services/reconciliacionService';

/**
 * Reconciliar un partido: ver todas sus versiones juntas y decidir, por cada equipo,
 * cuál queda como oficial.
 *
 * Existe porque, cuando los dos equipos mandan planilla del mismo partido, oficializarlas
 * de a una esconde el conflicto: el organizador aprueba la primera sin saber que la
 * segunda dice otra cosa. Acá se ve todo junto y se elige con la diferencia a la vista.
 *
 * Lo que NO hace: cambiar ganadores de set (eso reescribe el marcador y tiene su propio
 * flujo) ni editar números fila por fila — se elige una fuente entera por equipo.
 */

interface Props {
  partidoId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Se llama tras publicar, para que quien abrió el modal refresque lo suyo. */
  onPublicado?: (r: ResultadoPublicacion) => void;
}

const CAMPOS: Array<keyof Totales> = ['throws', 'hits', 'outs', 'catches'];
const INICIAL: Record<keyof Totales, string> = { throws: 'T', hits: 'H', outs: 'O', catches: 'C' };

const nombreJugador = (j: FilaJugadorReconciliacion['jugador']): string =>
  j.alias || [j.nombre, j.apellido].filter(Boolean).join(' ') || 'Jugador';

const ESTADO_LABEL: Record<string, string> = {
  pendiente_oficializacion: 'pide oficializar',
  oficializada: 'oficializada',
  rechazada: 'rechazada',
  borrador: 'borrador',
};

const etiquetaFuente = (f: FuenteReconciliacion): string => {
  if (f.tipo === 'oficial') return 'Oficial hoy';
  if (f.tipoDuenio === 'organizacion') return 'Reconciliación anterior';
  if (f.tipoDuenio === 'jugador') return 'Planilla de jugador';
  return `Planilla de ${f.equipoDuenio?.nombre ?? 'un equipo'}`;
};

const mismos = (a?: Totales, b?: Totales): boolean =>
  !!a && !!b && CAMPOS.every((c) => (a[c] || 0) === (b[c] || 0));

const ReconciliacionPartidoModal: React.FC<Props> = ({ partidoId, isOpen, onClose, onPublicado }) => {
  const [datos, setDatos] = useState<Reconciliacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eleccion, setEleccion] = useState<Record<string, string>>({});
  const [visibilidad, setVisibilidad] = useState<'organizacion' | 'publica'>('organizacion');
  const [publicando, setPublicando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionRequerida | null>(null);
  const [resultado, setResultado] = useState<ResultadoPublicacion | null>(null);
  // Sets existentes que toman el resultado de la planilla (por defecto ninguno: no se pisan).
  const [pisarSets, setPisarSets] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelado = false;
    setCargando(true);
    setError(null);
    setConfirmacion(null);
    setResultado(null);
    getReconciliacion(partidoId)
      .then((d) => {
        if (cancelado) return;
        setDatos(d);
        // Por defecto, cada equipo con la planilla que él mismo pidió oficializar; si no
        // mandó ninguna, queda lo oficial.
        const inicial: Record<string, string> = {};
        for (const eq of [d.partido.equipoLocal, d.partido.equipoVisitante]) {
          if (!eq) continue;
          const propia = d.fuentes.find(
            (f) => f.tipoDuenio === 'equipo' && f.equipoDuenio?._id === eq._id && f.estado === 'pendiente_oficializacion',
          );
          inicial[eq._id] = propia?.id ?? FUENTE_OFICIAL;
        }
        setEleccion(inicial);
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el partido');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [isOpen, partidoId]);

  const equipos = useMemo(
    () => [datos?.partido.equipoLocal, datos?.partido.equipoVisitante].filter(Boolean) as Array<{ _id: string; nombre?: string }>,
    [datos],
  );

  // Una planilla de totales no tiene sets: no lleva columna en la tabla de ganadores de set.
  const fuentesConSets = (datos?.fuentes ?? []).filter((f) => f.modo === 'sets');
  const algoParaPublicar = Object.values(eleccion).some((f) => f !== FUENTE_OFICIAL);

  const publicar = async (confirmar: boolean): Promise<void> => {
    setPublicando(true);
    setError(null);
    try {
      const r = await publicarReconciliacion(partidoId, {
        fuentePorEquipo: eleccion,
        visibilidad,
        confirmarSobrescritura: confirmar,
        pisarSets: [...pisarSets],
      });
      if ('confirmacion' in r) {
        setConfirmacion(r.confirmacion);
      } else {
        setConfirmacion(null);
        setResultado(r.resultado);
        onPublicado?.(r.resultado);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar');
    } finally {
      setPublicando(false);
    }
  };

  const footer = resultado ? (
    <div className="flex justify-end">
      <Button variant="primary" onClick={onClose}>Listo</Button>
    </div>
  ) : confirmacion ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="secondary" onClick={() => setConfirmacion(null)} disabled={publicando}>Volver</Button>
      <Button variant="danger" onClick={() => void publicar(true)} loading={publicando}>
        Reemplazar y publicar
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Visibilidad
        <select
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={visibilidad}
          onChange={(e) => setVisibilidad(e.target.value as 'organizacion' | 'publica')}
        >
          <option value="organizacion">Solo organización</option>
          <option value="publica">Pública</option>
        </select>
      </label>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary"
          onClick={() => void publicar(false)}
          loading={publicando}
          disabled={!datos?.puedePublicar || !algoParaPublicar}
          title={
            !datos?.puedePublicar
              ? 'Sólo quien administra el partido o la competencia puede publicar'
              : !algoParaPublicar
                ? 'Elegí al menos un equipo cuya planilla reemplace lo oficial'
                : undefined
          }
        >
          Publicar versión reconciliada
        </Button>
      </div>
    </div>
  );

  return (
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Reconciliar partido"
      subtitle={equipos.map((e) => e.nombre ?? 'Equipo').join(' vs ')}
      footer={footer}
    >
      {cargando && <p className="text-sm text-slate-500">Cargando las versiones del partido…</p>}

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      )}

      {resultado && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Versión reconciliada publicada.</p>
          <p>
            {resultado.reemplazos > 0
              ? `Se reemplazaron las estadísticas oficiales de ${resultado.reemplazos} jugador${resultado.reemplazos === 1 ? '' : 'es'}.`
              : 'No había estadísticas oficiales previas para esos jugadores.'}{' '}
            Las solicitudes de oficialización pendientes de este partido quedaron cerradas.
          </p>
          {resultado.avisos.map((a) => (
            <p key={a} className="text-xs text-amber-800">{a}</p>
          ))}
        </div>
      )}

      {confirmacion && !resultado && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            Esto reemplaza estadísticas oficiales de {confirmacion.reemplazos.length} jugador
            {confirmacion.reemplazos.length === 1 ? '' : 'es'}.
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            {confirmacion.reemplazos.map((r) => (
              <li key={r.jugador._id}>
                {nombreJugador(r.jugador)}
                {r.antes && (
                  <span className="text-amber-700"> — hoy {CAMPOS.map((c) => `${INICIAL[c]}${r.antes?.[c] ?? 0}`).join(' ')}</span>
                )}
              </li>
            ))}
          </ul>
          {confirmacion.avisos.map((a) => (
            <p key={a} className="text-xs">{a}</p>
          ))}
          <p className="text-xs">Las planillas de los equipos no se modifican: siempre podés volver a reconciliar.</p>
        </div>
      )}

      {datos && !resultado && !confirmacion && (
        <div className="space-y-6">
          {!datos.hayDiferencias && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Todas las versiones coinciden. Podés publicar cualquiera.
            </p>
          )}

          {equipos.map((equipo) => {
            const filas = datos.jugadores.filter((f) => f.equipo === equipo._id);
            // Columnas: lo oficial siempre, más cada planilla que tenga algún jugador de este equipo.
            const fuentes = datos.fuentes.filter(
              (f) => f.tipo === 'oficial' || filas.some((fila) => f.id in fila.valores),
            );
            const elegibles = fuentes.filter((f) => f.tipo === 'oficial' || f.tipoDuenio !== 'organizacion');
            const elegida = eleccion[equipo._id] ?? FUENTE_OFICIAL;

            return (
              <section key={equipo._id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800">{equipo.nombre ?? 'Equipo'}</h3>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Fuente para ${equipo.nombre ?? 'el equipo'}`}>
                    {elegibles.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="radio"
                        aria-checked={elegida === f.id}
                        onClick={() => setEleccion((prev) => ({ ...prev, [equipo._id]: f.id }))}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          elegida === f.id
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                        }`}
                      >
                        {f.tipo === 'oficial' ? 'Dejar lo oficial' : etiquetaFuente(f)}
                      </button>
                    ))}
                  </div>
                </div>

                {filas.length === 0 ? (
                  <p className="text-xs text-slate-500">Ninguna versión tiene jugadores de este equipo.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-2xs font-bold uppercase tracking-wide text-muted">
                          <th className="pb-2 pr-3">Jugador</th>
                          {fuentes.map((f) => (
                            <th
                              key={f.id}
                              className={`pb-2 pr-3 text-right ${elegida === f.id ? 'text-brand-600' : ''}`}
                            >
                              {etiquetaFuente(f)}
                              {f.estado && f.tipo === 'planilla' && (
                                <span className="block font-normal normal-case text-muted">
                                  {ESTADO_LABEL[f.estado] ?? f.estado} · {f.modo === 'sets' ? 'por set' : 'totales'}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {filas.map((fila) => {
                          const base = fila.valores[elegida];
                          return (
                            <tr key={fila.jugador._id} className="border-b border-slate-100 last:border-0">
                              <td className="py-1.5 pr-3 text-slate-800">
                                {nombreJugador(fila.jugador)}
                                {fila.difiere && (
                                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-700">
                                    difiere
                                  </span>
                                )}
                              </td>
                              {fuentes.map((f) => {
                                const v = fila.valores[f.id];
                                const distinto = v && base && !mismos(v, base);
                                return (
                                  <td
                                    key={f.id}
                                    className={`py-1.5 pr-3 text-right text-xs ${
                                      elegida === f.id ? 'bg-brand-50 font-semibold text-slate-900' : distinto ? 'text-amber-700' : 'text-slate-500'
                                    }`}
                                  >
                                    {v ? CAMPOS.map((c) => `${INICIAL[c]}${v[c]}`).join(' ') : '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}

          {datos.sets.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">Ganadores de set</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-2xs font-bold uppercase tracking-wide text-muted">
                      <th className="pb-2 pr-3">Set</th>
                      {fuentesConSets.map((f) => (
                        <th key={f.id} className="pb-2 pr-3">{etiquetaFuente(f)}</th>
                      ))}
                      <th className="pb-2">Usar planilla</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.sets.map((s) => (
                      <tr key={s.numeroSet} className="border-b border-slate-100 last:border-0">
                        <td className="py-1.5 pr-3 text-slate-800">
                          {s.numeroSet}
                          {s.difiere && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-700">difiere</span>
                          )}
                        </td>
                        {fuentesConSets.map((f) => (
                          <td key={f.id} className="py-1.5 pr-3 text-xs text-slate-600">{s.valores[f.id] ?? '—'}</td>
                        ))}
                        <td className="py-1.5">
                          {/* Sólo tiene sentido en sets que ya existen y alguna planilla trae otro ganador. */}
                          {FUENTE_OFICIAL in s.valores && s.difiere ? (
                            <input
                              type="checkbox"
                              checked={pisarSets.has(s.numeroSet)}
                              onChange={(e) => {
                                const next = new Set(pisarSets);
                                if (e.target.checked) next.add(s.numeroSet);
                                else next.delete(s.numeroSet);
                                setPisarSets(next);
                              }}
                              aria-label={`Usar el resultado de la planilla en el set ${s.numeroSet}`}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                Al publicar se crean los sets que el partido todavía no tiene, con el resultado de la planilla.
                Los que ya existen quedan como están, salvo los que marques en «Usar planilla». Crear o cambiar
                sets recalcula el marcador del partido.
              </p>
            </section>
          )}

          <p className="text-xs text-slate-500">
            T / H / O / C = throws, hits, outs, catches. «—» es que esa versión no tiene al jugador. Al publicar, las
            solicitudes de oficialización pendientes del partido se cierran: aceptadas las planillas que usaste,
            rechazadas las que no.
          </p>
        </div>
      )}
    </Overlay>
  );
};

export default ReconciliacionPartidoModal;
