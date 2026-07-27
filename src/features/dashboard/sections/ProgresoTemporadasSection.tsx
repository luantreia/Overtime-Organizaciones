import { useState } from 'react';
import { Link } from 'react-router-dom';

export interface ProgresoFase {
  id: string;
  nombre: string;
  estado?: string;
  equipos: number;
  partidosJugados: number;
  partidosTotal: number;
}

export interface ProgresoTemporada {
  id: string;
  competenciaId: string;
  competenciaNombre: string;
  temporadaNombre: string;
  equipos: number;
  partidosJugados: number;
  partidosTotal: number;
  fechaInicio?: string;
  fechaFin?: string;
  fases: ProgresoFase[];
}

interface ProgresoTemporadasSectionProps {
  loading: boolean;
  temporadas: ProgresoTemporada[];
}

const pctDe = (jugados: number, total: number) => (total > 0 ? Math.round((jugados / total) * 100) : 0);

// Atraso: compara cuánto tiempo pasó de la temporada contra cuántos partidos se jugaron.
// Positivo y grande = va atrasada respecto a la fecha de fin.
function calcularAtraso(t: ProgresoTemporada): number | null {
  if (!t.fechaInicio || !t.fechaFin) return null;
  const inicio = new Date(t.fechaInicio).getTime();
  const fin = new Date(t.fechaFin).getTime();
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin <= inicio) return null;
  const ahora = Date.now();
  const elapsedPct = Math.min(100, Math.max(0, ((ahora - inicio) / (fin - inicio)) * 100));
  const completionPct = pctDe(t.partidosJugados, t.partidosTotal);
  return elapsedPct - completionPct;
}

function faseActual(fases: ProgresoFase[]): ProgresoFase | undefined {
  return fases.find((f) => f.estado === 'en_curso') ?? fases.find((f) => f.estado !== 'finalizada') ?? fases[fases.length - 1];
}

const ProgresoTemporadasSection = ({ loading, temporadas }: ProgresoTemporadasSectionProps) => {
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Progreso de temporadas activas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    );
  }

  if (temporadas.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Progreso de temporadas activas</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {temporadas.map((t) => {
          const pct = pctDe(t.partidosJugados, t.partidosTotal);
          const atraso = calcularAtraso(t);
          const atrasada = atraso !== null && atraso >= 15;
          const alDia = atraso !== null && atraso < 15;
          const fActual = faseActual(t.fases);
          const abierta = !!abiertas[t.id];
          const barColor = t.partidosTotal === 0 ? 'bg-slate-300' : atrasada ? 'bg-amber-500' : 'bg-brand-500';

          return (
            <div
              key={t.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <Link to={`/competencias/${t.competenciaId}`} className="block">
                <p className="text-xs uppercase tracking-wide text-slate-400">{t.competenciaNombre}</p>
                <p className="text-lg font-semibold text-slate-900">{t.temporadaNombre}</p>
              </Link>

              <div className="flex flex-wrap items-center gap-1.5">
                {fActual && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Fase: {fActual.nombre}
                  </span>
                )}
                {atrasada && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700" title="El tiempo transcurrido de la temporada supera bastante al % de partidos jugados">
                    ⚠️ Atrasada
                  </span>
                )}
                {alDia && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Al día
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{t.equipos} equipos inscriptos</span>
                <span>{t.partidosJugados}/{t.partidosTotal} partidos jugados</span>
              </div>

              {t.partidosTotal === 0 ? (
                <p className="text-xs italic text-slate-400">Fixture no generado todavía</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{pct}%</span>
                </div>
              )}

              {t.fases.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {abierta ? 'Ocultar progreso por fase ▲' : 'Ver progreso por fase ▼'}
                  </button>
                  {abierta && (
                    <ul className="mt-2 space-y-2">
                      {t.fases.map((f) => {
                        const fPct = pctDe(f.partidosJugados, f.partidosTotal);
                        return (
                          <li key={f.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-semibold text-slate-700">{f.nombre}</span>
                                <span className="shrink-0 text-[11px] text-slate-500">
                                  {f.partidosTotal > 0 ? `${f.partidosJugados}/${f.partidosTotal} · ${fPct}%` : 'Sin fixture'}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-brand-400" style={{ width: `${fPct}%` }} />
                              </div>
                            </div>
                            <Link
                              to={`/competencias/${t.competenciaId}?tab=estructura&temporada=${t.id}&fase=${f.id}&openGestion=1`}
                              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600"
                            >
                              Gestionar
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProgresoTemporadasSection;
