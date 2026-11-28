import { useCallback, useEffect, useMemo, useState } from 'react';
import { StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from 'overtime-kit';
import { useConfirm, useToast } from '../../../shared/components/Toast/ToastProvider';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
import { borrarVideo, cargarVideo, editarVideo, getVideosCompetencia, type VideoCompetencia } from '../services/videosService';

type Props = { competenciaId: string };

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const errorTexto = (err: unknown) => (err instanceof Error ? err.message : 'Error inesperado');

const nombrePartido = (p: Partido) => {
  const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
  const equipos = `${p.equipoLocal?.nombre ?? p.localNombre ?? 'Local'} vs ${p.equipoVisitante?.nombre ?? p.visitanteNombre ?? 'Visitante'}`;
  return [fecha, equipos].filter(Boolean).join(' · ');
};

/**
 * Pestaña Videos: el catálogo de videos de la competencia. Cada video puede ser una cámara de un
 * partido (la primera es la principal: la que ven la ficha y Overtime TV) o un video suelto de la
 * competencia (highlights, resúmenes). Lo que se carga acá sale directo, sin aprobación.
 * Los canales de la TV no se arman acá: son de Overtime-Admin.
 */
export default function VideosTab({ competenciaId }: Props) {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [videos, setVideos] = useState<VideoCompetencia[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState({ url: '', titulo: '', partido: '' });
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'sinVideo'>('todos');

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [vs, ps] = await Promise.all([getVideosCompetencia(competenciaId), getPartidosPorCompetencia(competenciaId)]);
      setVideos(vs);
      setPartidos([...ps].sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? ''))));
    } catch (err) {
      addToast({ type: 'error', title: 'No se pudieron cargar los videos', message: errorTexto(err) });
    } finally {
      setCargando(false);
    }
  }, [competenciaId, addToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porPartido = useMemo(() => {
    const m = new Map<string, VideoCompetencia[]>();
    for (const v of videos) {
      if (!v.partido) continue;
      const k = v.partido._id;
      m.set(k, [...(m.get(k) ?? []), v]);
    }
    m.forEach((lista) => lista.sort((a, b) => a.orden - b.orden));
    return m;
  }, [videos]);
  const sueltos = videos.filter((v) => !v.partido);
  const partidosSinVideo = partidos.filter((p) => !porPartido.has(p.id));

  // Mover, hacer principal o borrar reordena las cámaras del partido: se vuelve a pedir la lista.
  const ejecutar = async (accion: () => Promise<unknown>, exito?: string) => {
    try {
      await accion();
      if (exito) addToast({ type: 'success', title: exito });
      await cargar();
    } catch (err) {
      addToast({ type: 'error', title: 'No se pudo guardar', message: errorTexto(err) });
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    await ejecutar(
      () => cargarVideo({ url: nuevo.url, titulo: nuevo.titulo, competencia: competenciaId, partido: nuevo.partido || null }),
      'Video cargado',
    );
    setNuevo({ url: '', titulo: '', partido: '' });
    setEnviando(false);
  };

  const quitar = async (v: VideoCompetencia) => {
    const ok = await confirm({
      title: '¿Eliminar este video?',
      message: v.partido ? 'El partido se queda sin esta cámara.' : 'Sale del catálogo y de Overtime TV.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) await ejecutar(() => borrarVideo(v._id));
  };

  const Fila = ({ v, principal }: { v: VideoCompetencia; principal?: boolean }) => (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="h-12 w-20 shrink-0 rounded object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <input
          aria-label="Título del video"
          className="w-full rounded border border-transparent px-1 text-sm font-medium text-slate-900 hover:border-slate-200 focus:border-brand-500 focus:outline-none"
          defaultValue={v.titulo || v.etiqueta}
          placeholder={v.partido ? 'Nombre de la cámara' : 'Título'}
          onBlur={(e) => {
            const valor = e.target.value;
            if (valor === (v.titulo || v.etiqueta)) return;
            ejecutar(() => editarVideo(v._id, v.partido ? { etiqueta: valor } : { titulo: valor }));
          }}
        />
        <p className="truncate px-1 text-xs text-muted">
          {principal ? 'Cámara principal · ' : ''}
          {v.duracion ? `${Math.round(v.duracion / 60)} min` : 'duración pendiente'}
          {v.enTv ? '' : ' · fuera de TV'}
        </p>
      </div>
      <select
        aria-label="Partido del video"
        className={`${inputCls} w-auto max-w-[14rem]`}
        value={v.partido?._id ?? ''}
        onChange={(e) => ejecutar(() => editarVideo(v._id, { partido: e.target.value || null }))}
      >
        <option value="">Suelto (sin partido)</option>
        {partidos.map((p) => (
          <option key={p.id} value={p.id}>
            {nombrePartido(p)}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={v.enTv} onChange={(e) => ejecutar(() => editarVideo(v._id, { enTv: e.target.checked }))} />
        En TV
      </label>
      {v.partido && !principal && (
        <button
          type="button"
          title="Hacer cámara principal"
          aria-label="Hacer cámara principal"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-600"
          onClick={() => ejecutar(() => editarVideo(v._id, { principal: true }))}
        >
          <StarIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      <button type="button" aria-label="Eliminar video" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600" onClick={() => quitar(v)}>
        <TrashIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </li>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={enviar} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Cargar video</h2>
        <p className="text-xs text-muted">
          Link de YouTube (podés incluir el <code>t=</code> donde arranca). Si lo asignás a un partido y ya tenía video, entra como otra cámara.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <input required aria-label="Link de YouTube" className={inputCls} placeholder="https://youtube.com/watch?v=…" value={nuevo.url} onChange={(e) => setNuevo({ ...nuevo, url: e.target.value })} />
          <input aria-label="Título o cámara" className={inputCls} placeholder="Título / cámara (opcional)" value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} />
          <select aria-label="Partido" className={inputCls} value={nuevo.partido} onChange={(e) => setNuevo({ ...nuevo, partido: e.target.value })}>
            <option value="">Sin partido (video de la competencia)</option>
            {partidos.map((p) => (
              <option key={p.id} value={p.id}>
                {porPartido.has(p.id) ? '🎥 ' : ''}
                {nombrePartido(p)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" loading={enviando}>
          Cargar
        </Button>
      </form>

      {cargando ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-700">
              <strong>{porPartido.size}</strong> de {partidos.length} partidos con video · <strong>{sueltos.length}</strong> videos sueltos
            </span>
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" checked={filtro === 'sinVideo'} onChange={(e) => setFiltro(e.target.checked ? 'sinVideo' : 'todos')} />
              Ver partidos sin video
            </label>
          </div>

          {filtro === 'sinVideo' ? (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {partidosSinVideo.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="truncate text-slate-900">{nombrePartido(p)}</span>
                  <Button size="xs" variant="outline" onClick={() => setNuevo((n) => ({ ...n, partido: p.id }))}>
                    Cargar video
                  </Button>
                </li>
              ))}
              {partidosSinVideo.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Todos los partidos tienen video.</li>}
            </ul>
          ) : (
            <>
              {partidos
                .filter((p) => porPartido.has(p.id))
                .map((p) => (
                  <section key={p.id} className="rounded-2xl border border-slate-200 bg-white">
                    <h3 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{nombrePartido(p)}</h3>
                    <ul className="divide-y divide-slate-100">
                      {(porPartido.get(p.id) ?? []).map((v, i) => (
                        <Fila key={v._id} v={v} principal={i === 0} />
                      ))}
                    </ul>
                  </section>
                ))}
              {sueltos.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white">
                  <h3 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">Videos de la competencia</h3>
                  <ul className="divide-y divide-slate-100">
                    {sueltos.map((v) => (
                      <Fila key={v._id} v={v} />
                    ))}
                  </ul>
                </section>
              )}
              {videos.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-muted">Todavía no hay videos en esta competencia.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
