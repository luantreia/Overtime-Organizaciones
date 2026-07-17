import { Link } from 'react-router-dom';

export interface ProgresoTemporada {
  id: string;
  competenciaId: string;
  competenciaNombre: string;
  temporadaNombre: string;
  equipos: number;
  partidosJugados: number;
  partidosTotal: number;
}

interface ProgresoTemporadasSectionProps {
  loading: boolean;
  temporadas: ProgresoTemporada[];
}

const ProgresoTemporadasSection = ({ loading, temporadas }: ProgresoTemporadasSectionProps) => {
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
          const pct = t.partidosTotal > 0 ? Math.round((t.partidosJugados / t.partidosTotal) * 100) : 0;
          return (
            <Link
              key={t.id}
              to={`/competencias/${t.competenciaId}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{t.competenciaNombre}</p>
                <p className="text-lg font-semibold text-slate-900">{t.temporadaNombre}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{t.equipos} equipos inscriptos</span>
                <span>{t.partidosJugados}/{t.partidosTotal} partidos jugados</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ProgresoTemporadasSection;
