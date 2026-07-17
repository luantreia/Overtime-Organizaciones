import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import type { Partido } from '../../../types';

interface ProximosPartidosSectionProps {
  loading: boolean;
  partidos: Partido[];
}

const ProximosPartidosSection = ({ loading, partidos }: ProximosPartidosSectionProps) => (
  <section className="space-y-4">
    <header className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900">Próximos partidos</h2>
      <span className="text-xs uppercase tracking-wide text-slate-400">Próximos 7 días</span>
    </header>
    {loading ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    ) : partidos.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partidos.map((p) => (
          <PartidoCard key={p.id} partido={p} variante="proximo" />
        ))}
      </div>
    ) : (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
        No hay partidos programados para los próximos 7 días.
      </p>
    )}
  </section>
);

export default ProximosPartidosSection;
