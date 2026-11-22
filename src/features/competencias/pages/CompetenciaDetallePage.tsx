import { Link, useParams } from 'react-router-dom';
import { useFiltrosURL } from '../../../shared/hooks/useFiltrosURL';
import { useCompetenciaDetalle } from '../hooks/useCompetenciaDetalle';
import GeneralTab from '../tabs/GeneralTab';
import EstructuraTab from '../tabs/EstructuraTab';
import PartidosTab from '../tabs/PartidosTab';
import CompetenciaRankedSection from '../sections/CompetenciaRankedSection';

type Tab = 'general' | 'estructura' | 'partidos' | 'ranked';

const ETIQUETAS: Record<Tab, string> = {
  general: 'General',
  estructura: 'Temporadas/Fases',
  partidos: 'Partidos',
  ranked: 'Ranked',
};

/**
 * Cáscara del detalle de una competencia: carga lo compartido, dibuja el encabezado y elige la
 * pestaña según `?tab=`. Cada pestaña es dueña de su propio estado (ver `../tabs/`); si algo nuevo
 * es de una sola pestaña, va en esa pestaña y no acá.
 */
const CompetenciaDetallePage = () => {
  const { id: competenciaId } = useParams<{ id: string }>();
  const detalle = useCompetenciaDetalle(competenciaId);
  const filtros = useFiltrosURL<'tab'>();

  const tabs: Tab[] = ['general', 'estructura', 'partidos', ...(detalle.datos.rankedEnabled ? ['ranked' as const] : [])];
  const pedida = filtros.get('tab') as Tab;
  const tab: Tab = tabs.includes(pedida) ? pedida : 'estructura';
  // `estructura` es la pestaña por defecto: no se escribe en la URL.
  const setTab = (t: Tab) => filtros.set({ tab: t === 'estructura' ? null : t });

  if (!competenciaId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Competencia no encontrada</h1>
      </div>
    );
  }

  const nombre = detalle.datos.nombre || 'Competencia';

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <nav className="text-xs text-slate-500">
          <Link className="hover:underline" to="/competencias">Competencias</Link>
          <span> / </span>
          <span className="text-slate-700 font-medium">{nombre}</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-900">{nombre}</h1>
        <p className="text-sm text-slate-500">Administración y estructura</p>
        <div className="mt-2 flex gap-2 text-sm overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${tab === t ? 'bg-brand-100 text-brand-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {ETIQUETAS[t]}
            </button>
          ))}
        </div>
      </header>

      {tab === 'general' ? <GeneralTab competenciaId={competenciaId} detalle={detalle} /> : null}
      {tab === 'estructura' ? <EstructuraTab competenciaId={competenciaId} detalle={detalle} /> : null}
      {tab === 'partidos' ? <PartidosTab competenciaId={competenciaId} detalle={detalle} /> : null}
      {tab === 'ranked' ? (
        <CompetenciaRankedSection
          competenciaId={competenciaId}
          modalidad={detalle.datos.modalidad}
          categoria={detalle.datos.categoria}
          organizacionId={detalle.organizacionId || undefined}
        />
      ) : null}
    </div>
  );
};

export default CompetenciaDetallePage;
