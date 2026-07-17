import { Link } from 'react-router-dom';
import type { Partido } from '../../../types';

export interface HuecoDato {
  id: string;
  texto: string;
  href: string;
}

interface AtencionSectionProps {
  loading: boolean;
  partidosPendientes: Partido[];
  solicitudesPendientesCount: number;
  huecos: HuecoDato[];
}

const partidoTexto = (p: Partido) => {
  const local = p.equipoLocal?.nombre ?? p.localNombre ?? 'Local';
  const visitante = p.equipoVisitante?.nombre ?? p.visitanteNombre ?? 'Visitante';
  return `${local} vs ${visitante} — ${p.fecha}${p.hora ? ` ${p.hora}` : ''}`;
};

const Tile = ({
  titulo,
  valor,
  tono,
  href,
}: {
  titulo: string;
  valor: number;
  tono: 'rose' | 'amber' | 'emerald';
  href: string;
}) => {
  const toneClasses = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[tono];
  return (
    <Link
      to={href}
      className={`flex flex-col gap-1 rounded-2xl border p-5 shadow-card transition hover:shadow-md ${toneClasses}`}
    >
      <p className="text-3xl font-bold">{valor}</p>
      <p className="text-sm font-medium">{titulo}</p>
    </Link>
  );
};

const AtencionSection = ({ loading, partidosPendientes, solicitudesPendientesCount, huecos }: AtencionSectionProps) => {
  const totalPendiente = partidosPendientes.length + solicitudesPendientesCount + huecos.length;

  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Necesita tu atención</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          titulo="Partidos por finalizar"
          valor={partidosPendientes.length}
          tono={partidosPendientes.length > 0 ? 'rose' : 'emerald'}
          href="/partidos"
        />
        <Tile
          titulo="Solicitudes pendientes"
          valor={solicitudesPendientesCount}
          tono={solicitudesPendientesCount > 0 ? 'amber' : 'emerald'}
          href="/notificaciones"
        />
        <Tile
          titulo="Datos incompletos"
          valor={huecos.length}
          tono={huecos.length > 0 ? 'amber' : 'emerald'}
          href="/competencias"
        />
      </div>

      {totalPendiente === 0 ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Todo al día ✅ — no hay partidos por finalizar, solicitudes pendientes ni datos incompletos.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {partidosPendientes.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link to={`/partidos/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50">
                <span className="text-slate-700">{partidoTexto(p)}</span>
                <span className="flex-shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                  Sin finalizar
                </span>
              </Link>
            </li>
          ))}
          {huecos.slice(0, 6).map((h) => (
            <li key={h.id}>
              <Link to={h.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50">
                <span className="text-slate-700">{h.texto}</span>
                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Revisar
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AtencionSection;
