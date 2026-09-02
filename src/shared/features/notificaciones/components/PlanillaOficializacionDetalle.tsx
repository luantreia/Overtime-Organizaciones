import React, { useEffect, useState } from 'react';
import {
  getRevisionPlanilla,
  nombreDeJugador,
  totalesPlanilla,
  totalesOficiales,
  type RevisionPlanilla,
} from '../../solicitudes/services/planillaRevisionService';

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
}

type Totales = { throws: number; hits: number; outs: number; catches: number };

const CAMPOS: Array<keyof Totales> = ['throws', 'hits', 'outs', 'catches'];

const VACIO: Totales = { throws: 0, hits: 0, outs: 0, catches: 0 };

const PlanillaOficializacionDetalle: React.FC<Props> = ({ planillaId }) => {
  const [revision, setRevision] = useState<RevisionPlanilla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const { planilla, oficial } = revision;
  const dePlanilla = totalesPlanilla(planilla);
  const deOficial = totalesOficiales(revision);

  const setsNuevos = planilla.sets.filter((s) => !s.setPartido).length;
  const presentesNuevos = planilla.presentes.filter((p) => !p.jugadorPartido).length;
  const equipoNombre =
    typeof planilla.equipo === 'object' ? planilla.equipo.nombre ?? 'el equipo' : 'el equipo';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">{equipoNombre}</span> cargó esta planilla por su cuenta.
          Nada de esto está todavía en el registro oficial.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Modo {planilla.modo === 'sets' ? 'set a set' : 'totales del partido'} ·{' '}
          {planilla.presentes.length} jugador{planilla.presentes.length === 1 ? '' : 'es'} ·{' '}
          {planilla.sets.length} set{planilla.sets.length === 1 ? '' : 's'} · visibilidad al aprobar:{' '}
          {planilla.visibilidadObjetivo === 'publica' ? 'pública' : 'solo organización'}
        </p>
      </div>

      {(setsNuevos > 0 || presentesNuevos > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">Si aprobás, se crea estructura nueva en el partido</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
            {presentesNuevos > 0 && (
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
            el resultado de cada set.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3">Jugador</th>
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
                <tr key={presente._id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 text-slate-800">
                    {nombreDeJugador(presente.jugador)}
                    {!presente.jugadorPartido && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Alta nueva
                      </span>
                    )}
                  </td>
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
                  <td className="py-1.5 text-right text-xs text-slate-400">
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

      {oficial.sets.length > 0 && (
        <p className="text-xs text-slate-500">
          El partido ya tiene {oficial.sets.length} set{oficial.sets.length === 1 ? '' : 's'}{' '}
          cargado{oficial.sets.length === 1 ? '' : 's'} por la organización.
        </p>
      )}
    </div>
  );
};

export default PlanillaOficializacionDetalle;
