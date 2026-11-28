import { Link, useParams } from 'react-router-dom';
import { Tabs, TabPanel } from 'overtime-kit';
import { useFiltrosURL } from '../../../shared/hooks/useFiltrosURL';
import { useCompetenciaDetalle } from '../hooks/useCompetenciaDetalle';
import GeneralTab from '../tabs/GeneralTab';
import EstructuraTab from '../tabs/EstructuraTab';
import PartidosTab from '../tabs/PartidosTab';
import VideosTab from '../tabs/VideosTab';
import CompetenciaRankedSection from '../sections/CompetenciaRankedSection';

type Tab = 'general' | 'estructura' | 'partidos' | 'videos' | 'ranked';

const ETIQUETAS: Record<Tab, string> = {
  general: 'General',
  estructura: 'Temporadas/Fases',
  partidos: 'Partidos',
  videos: 'Videos',
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

  const tabs: Tab[] = ['general', 'estructura', 'partidos', 'videos', ...(detalle.datos.rankedEnabled ? ['ranked' as const] : [])];
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
        <Tabs
          aria-label="Secciones de la competencia"
          idBase="competencia"
          size="sm"
          className="mt-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
          items={tabs.map((t) => ({ id: t, label: ETIQUETAS[t] }))}
          value={tab}
          onChange={setTab}
        />
      </header>

      <TabPanel idBase="competencia" id={tab}>
        {tab === 'general' ? <GeneralTab competenciaId={competenciaId} detalle={detalle} /> : null}
        {tab === 'estructura' ? <EstructuraTab competenciaId={competenciaId} detalle={detalle} /> : null}
        {tab === 'partidos' ? <PartidosTab competenciaId={competenciaId} detalle={detalle} /> : null}
        {tab === 'videos' ? <VideosTab competenciaId={competenciaId} /> : null}
        {tab === 'ranked' ? (
          <CompetenciaRankedSection
            competenciaId={competenciaId}
            modalidad={detalle.datos.modalidad}
            categoria={detalle.datos.categoria}
            organizacionId={detalle.organizacionId || undefined}
          />
        ) : null}
      </TabPanel>
    </div>
  );
};

export default CompetenciaDetallePage;
