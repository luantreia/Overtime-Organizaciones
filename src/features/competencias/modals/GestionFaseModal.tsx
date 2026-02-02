import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import type { BackendFase, BackendParticipacionFase, BackendParticipacionTemporada } from '../services';
import FaseLigaSection from './sections/FaseLigaSection';
import FaseGruposSection from './sections/FaseGruposSection';
import FasePlayoffSection from './sections/FasePlayoffSection';
import { updateParticipacionFase, deleteParticipacionFase } from '../services/participacionFaseService';
import { getPartidosPorFase, crearPartidoCompetencia } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
import ModalInformacionPartido from '../../partidos/components/modals/ModalInformacionPartido';
import ModalAlineacionPartido from '../../partidos/components/modals/ModalAlineacionPartido';
import ModalGestionSets from '../../partidos/components/modals/ModalGestionSets';
import { getTemporadaById } from '../services/temporadasService';
import { getCompetenciaById } from '../services/competenciasService';
import { VisualBracket } from '../components/VisualBracket';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  esAdmin: boolean;
  fase?: BackendFase;
  temporadaId?: string;
  participantesFase: BackendParticipacionFase[];
  participantesTemporada: BackendParticipacionTemporada[];
  onAgregar: (faseId: string, ptId: string, opts?: { grupo?: string; division?: string }) => void | Promise<void>;
  onGenerarLlave?: (faseId: string) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
};

export default function GestionParticipantesFaseModal({ 
  isOpen, 
  onClose, 
  esAdmin, 
  fase, 
  temporadaId, 
  participantesFase, 
  participantesTemporada, 
  onAgregar, 
  onGenerarLlave,
  onRefresh
}: Props) {
  const [activeTab, setActiveTab] = useState<'participantes' | 'partidos' | 'configuracion'>('participantes');
  const [selectedPTs, setSelectedPTs] = useState<string[]>([]);
  const [grupo, setGrupo] = useState('');
  const [division, setDivision] = useState('');
  const [items, setItems] = useState<BackendParticipacionFase[]>(participantesFase || []);
  const [notice, setNotice] = useState<string>('');
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [nuevoLocal, setNuevoLocal] = useState('');
  const [nuevoVisitante, setNuevoVisitante] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [infoModalAbierto, setInfoModalAbierto] = useState(false);
  const [partidoInfoId, setPartidoInfoId] = useState<string | null>(null);
  const [gestionSetsAbierto, setGestionSetsAbierto] = useState(false);
  const [partidoSetsId, setPartidoSetsId] = useState<string | null>(null);
  const [alineacionModalAbierto, setAlineacionModalAbierto] = useState(false);
  const [partidoAlineacionId, setPartidoAlineacionId] = useState<string | null>(null);
  const [modalidadComp, setModalidadComp] = useState<string | undefined>(undefined);
  const [categoriaComp, setCategoriaComp] = useState<string | undefined>(undefined);

  // Filtros de partidos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string | 'all'>('all');

  // Drag and Drop State for Visual Builder
  const [modoVisual, setModoVisual] = useState(false);
  const [dragItem, setDragItem] = useState<{ id: string, nombre: string, escudo?: string } | null>(null);
  const [partidosEnCola, setPartidosEnCola] = useState<any[]>([]);

  const handleDragStart = (pt: any) => {
    const eq = (pt?.participacionTemporada?.equipo as any);
    const id = typeof eq === 'string' ? eq : eq?._id;
    const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
    const escudo = eq?.escudo;
    setDragItem({ id, nombre, escudo });
  };

  const handleDrop = (slot: 'local' | 'visitante') => {
    if (!dragItem) return;
    if (slot === 'local') setNuevoLocal(dragItem.id);
    else setNuevoVisitante(dragItem.id);
    setDragItem(null);
  };

  useEffect(() => {
    setItems(participantesFase || []);
  }, [participantesFase, fase?._id, isOpen]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !fase?._id) return;
      try {
        const lista = await getPartidosPorFase(fase._id);
        setPartidos(lista);
      } catch {}
    };
    void load();
  }, [isOpen, fase?._id]);

  useEffect(() => {
    const loadCtx = async () => {
      try {
        if (!temporadaId) return;
        const temp = await getTemporadaById(temporadaId);
        if (!temp?.competencia) return;
        const comp = await getCompetenciaById(temp.competencia);
        setModalidadComp(comp?.modalidad);
        setCategoriaComp(comp?.categoria);
      } catch {}
    };
    void loadCtx();
  }, [temporadaId]);

  const existentes = useMemo(() => new Set(
    (items || []).map((pf) =>
      typeof pf.participacionTemporada === 'string' ? pf.participacionTemporada : (pf.participacionTemporada as any)?._id
    )
  ), [items]);

  const opcionesAgregar = useMemo(() => (participantesTemporada || []).filter((pt) => !existentes.has(pt._id)), [participantesTemporada, existentes]);

  const tipo = (fase as any)?.tipo as string | undefined;

  const partidosOrdenados = useMemo(() => {
    const toTime = (p: Partido) => {
      // fecha en formato YYYY-MM-DD, hora opcional HH:mm
      const iso = p.hora ? `${p.fecha}T${p.hora}:00` : `${p.fecha}T00:00:00`;
      return new Date(iso).getTime();
    };
    return [...partidos].sort((a, b) => toTime(a) - toTime(b));
  }, [partidos]);

  const statsCompletado = useMemo(() => {
    if (partidos.length === 0) return 0;
    const finalizados = partidos.filter(p => p.estado === 'finalizado').length;
    return Math.round((finalizados / partidos.length) * 100);
  }, [partidos]);

  const partidosFiltrados = useMemo(() => {
    return partidosOrdenados.filter(p => {
      const search = searchTerm.toLowerCase();
      const matchSearch = search === '' || 
        (p.localNombre || '').toLowerCase().includes(search) ||
        (p.visitanteNombre || '').toLowerCase().includes(search);
      const matchEstado = filterEstado === 'all' || p.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [partidosOrdenados, searchTerm, filterEstado]);

  const ordenEtapas = ['octavos', 'cuartos', 'semifinal', 'final', 'tercer_puesto', 'repechaje', 'otro'];
  const porEtapa = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosFiltrados) {
      const e = (p.etapa || 'otro').toString();
      if (!map[e]) map[e] = [];
      map[e].push(p);
    }
    return map;
  }, [partidosFiltrados]);

  const porGrupo = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosFiltrados) {
      const g = (p.grupo ?? '—').toString();
      if (!map[g]) map[g] = [];
      map[g].push(p);
    }
    return map;
  }, [partidosFiltrados]);

  const porDivision = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosFiltrados) {
      const d = (p.division ?? '—').toString();
      if (!map[d]) map[d] = [];
      map[d].push(p);
    }
    return map;
  }, [partidosFiltrados]);

  const seccionAgregarVisible = esAdmin && opcionesAgregar.length > 0 && !!fase?._id;

  const renderStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'finalizado': return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">Finalizado</span>;
      case 'en_curso': return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase animate-pulse">En curso</span>;
      default: return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">Pendiente</span>;
    }
  };

  const renderMatchCard = (p: Partido) => (
    <li key={p.id} className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {p.etapa ? p.etapa.replace('_', ' ') : (p.grupo ? `Grupo ${p.grupo}` : (p.division ? `División ${p.division}` : 'Partido'))}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {new Date(p.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} {p.hora ? `· ${p.hora} hs` : ''}
          </span>
        </div>
        {renderStatusBadge(p.estado)}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 flex-col items-center text-center">
          <div className="mb-1 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-sm">🏟️</div>
          <span className="text-sm font-bold text-slate-900 line-clamp-1">{p.localNombre || 'Local'}</span>
        </div>
        
        <div className="flex flex-col items-center px-4">
          {p.estado === 'programado' ? (
            <span className="text-xl font-black text-slate-300 italic">VS</span>
          ) : (
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-1.5 rounded-xl shadow-lg border border-slate-700">
              <span className="text-2xl font-black text-white tabular-nums leading-none">{p.marcadorLocal ?? 0}</span>
              <span className="h-4 w-px bg-slate-700"></span>
              <span className="text-2xl font-black text-white tabular-nums leading-none">{p.marcadorVisitante ?? 0}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center text-center">
          <div className="mb-1 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-sm">🛡️</div>
          <span className="text-sm font-bold text-slate-900 line-clamp-1">{p.visitanteNombre || p.rival || 'Visitante'}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 pt-3 border-t border-slate-50">
        <button 
          className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          onClick={() => { setPartidoInfoId(p.id); setInfoModalAbierto(true); }}
        >
          Info
        </button>
        <button 
          className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition border border-brand-100"
          onClick={() => { setPartidoSetsId(p.id); setGestionSetsAbierto(true); }}
        >
          Sets
        </button>
        <button 
          className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          onClick={() => { setPartidoAlineacionId(p.id); setAlineacionModalAbierto(true); }}
        >
          Plantilla
        </button>
      </div>
    </li>
  );

  const contenido = (
    <div className="max-h-[80vh] overflow-y-auto">
      {notice ? (
        <div className="sticky top-0 z-20 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium shadow-sm animate-in fade-in slide-in-from-top-2">
          {notice}
        </div>
      ) : null}

      {/* HEADER DE FASE */}
      <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col lg:items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipos</span>
            <span className="text-xl font-black text-brand-600">{items.length}</span>
          </div>
          <div className="flex flex-col lg:items-center border-l border-slate-200 pl-4 sm:pl-0 sm:border-l-0 sm:border-x">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partidos</span>
            <span className="text-xl font-black text-slate-700">{partidos.length}</span>
          </div>
          <div className="flex flex-col lg:items-center border-t sm:border-t-0 pt-4 sm:pt-0 sm:border-r border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalizados</span>
            <span className="text-xl font-black text-green-600">{partidos.filter(p => p.estado === 'finalizado').length}</span>
          </div>
          <div className="flex flex-col lg:items-center border-l sm:border-l-0 border-t sm:border-t-0 pt-4 sm:pt-0 pl-4 sm:pl-0 border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progreso</span>
            <span className="text-xl font-black text-slate-900">{statsCompletado}%</span>
          </div>
        </div>
        
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-1000 ease-out" 
            style={{ width: `${statsCompletado}%` }}
          />
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('participantes')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'participantes' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Participantes
        </button>
        <button
          onClick={() => setActiveTab('partidos')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'partidos' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Calendario
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'configuracion' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Configuración
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="px-1">
        {activeTab === 'participantes' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            {tipo === 'liga' ? (
              <FaseLigaSection
                participantes={items}
                esAdmin={esAdmin}
                onUpdate={async (id: string, body: Partial<{ division: string }>) => {
                  await updateParticipacionFase(id, body);
                  setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p));
                  setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
                onDelete={async (id: string) => {
                  if (!window.confirm('¿Eliminar este participante de la fase?')) return;
                  await deleteParticipacionFase(id);
                  setItems((prev)=> prev.filter(p=> p._id !== id));
                  setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
              />
            ) : tipo === 'grupo' ? (
              <FaseGruposSection
                participantes={items}
                esAdmin={esAdmin}
                onUpdate={async (id: string, body: Partial<{ grupo: string }>) => {
                  await updateParticipacionFase(id, body);
                  setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p));
                  setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
                onDelete={async (id: string) => {
                  if (!window.confirm('¿Eliminar este participante de la fase?')) return;
                  await deleteParticipacionFase(id);
                  setItems((prev)=> prev.filter(p=> p._id !== id));
                  setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
              />
            ) : (tipo === 'playoff' || tipo === 'promocion') ? (
              <FasePlayoffSection
                participantes={items}
                esAdmin={esAdmin}
                onUpdate={async (id: string, body: Partial<{ seed: number; posicion: number }>) => {
                  await updateParticipacionFase(id, body);
                  setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p));
                  setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
                onDelete={async (id: string) => {
                  if (!window.confirm('¿Eliminar este participante de la fase?')) return;
                  await deleteParticipacionFase(id);
                  setItems((prev)=> prev.filter(p=> p._id !== id));
                  setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
                  onRefresh?.();
                }}
              />
            ) : (
              <FaseGruposSection participantes={items} esAdmin={esAdmin} onUpdate={async (id: string, body: Partial<{ grupo: string }>) => { await updateParticipacionFase(id, body); setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p)); setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200); onRefresh?.(); }} onDelete={async (id: string) => { if (!window.confirm('¿Eliminar este participante de la fase?')) return; await deleteParticipacionFase(id); setItems((prev)=> prev.filter(p=> p._id !== id)); setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200); onRefresh?.(); }} />
            )}
          </section>
        )}

        {activeTab === 'partidos' && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* BUSCADOR Y FILTROS */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar equipo..."
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'programado', label: 'Pendientes' },
                  { value: 'en_juego', label: 'En vivo' },
                  { value: 'finalizado', label: 'Terminados' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterEstado(f.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      filterEstado === f.value 
                        ? 'bg-brand-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {partidosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <span className="text-4xl mb-3">{searchTerm || filterEstado !== 'all' ? '🔍' : '📅'}</span>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {searchTerm || filterEstado !== 'all' ? 'No se encontraron partidos' : 'No hay partidos programados'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchTerm || filterEstado !== 'all' 
                    ? 'Intenta ajustando los filtros o el buscador.' 
                    : 'Crea partidos manualmente o genera la llave en la pestaña Configuración.'}
                </p>
              </div>
            ) : (
              <>
                {(tipo === 'playoff' || tipo === 'promocion') && (
                  <div className="mb-10 animate-in fade-in duration-700">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-3">
                      <span className="p-1 px-2 bg-slate-900 text-white rounded text-[9px]">DIAGRAMA</span>
                      Cuadro de Competencia
                    </h5>
                    <VisualBracket 
                      matches={partidos} 
                      onMatchClick={(id) => { setPartidoInfoId(id); setInfoModalAbierto(true); }}
                    />
                  </div>
                )}

                {(tipo === 'playoff' || tipo === 'promocion') && Object.keys(porEtapa).length > 0 ? (
                  <div className="space-y-8">
                    {ordenEtapas.filter(e => porEtapa[e]?.length).map((e) => (
                      <div key={e}>
                        <h5 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-600 mb-4">
                          <span className="block h-px flex-1 bg-brand-100"></span>
                          {e.replace('_', ' ')}
                          <span className="block h-px flex-1 bg-brand-100"></span>
                        </h5>
                        <ul className="grid gap-4 sm:grid-cols-2">
                          {porEtapa[e].map((p) => renderMatchCard(p))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(tipo === 'grupo' ? Object.entries(porGrupo) : tipo === 'liga' ? Object.entries(porDivision) : (Object.keys(porGrupo).some(k => k !== '—') ? Object.entries(porGrupo) : Object.entries(porDivision)))
                      .map(([key, arr]) => (
                        <div key={key}>
                          <h5 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                            <span className="block h-px flex-1 bg-slate-100"></span>
                            {tipo === 'grupo' ? `Grupo ${key}` : tipo === 'liga' ? `División ${key}` : (key !== '—' ? `Grupo ${key}` : 'Fase Regular')}
                            <span className="block h-px flex-1 bg-slate-100"></span>
                          </h5>
                          <ul className="grid gap-4 sm:grid-cols-2">
                            {arr.map((p) => renderMatchCard(p))}
                          </ul>
                        </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'configuracion' && (
          <section className="space-y-8 animate-in fade-in duration-300">
            {/* Acciones de Fase */}
            {esAdmin && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-brand-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  Configuración de Encuentros
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button 
                    type="button" 
                    className="flex-1 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 hover:bg-brand-700 transition flex items-center justify-center gap-2" 
                    onClick={async () => { 
                      if (fase?._id) { 
                        await onGenerarLlave?.(fase._id); 
                        onRefresh?.();
                      } 
                    }}
                  >
                    ⚡ {tipo === 'playoff' || tipo === 'promocion' ? 'Generar Llave de Playoffs' : 'Generar Fixture Automático'}
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-brand-600/70 font-medium italic">
                  * Esta acción creará los partidos base según los participantes actuales de la fase. Si ya existen partidos, podría duplicarlos o resetearlos según la configuración del servidor.
                </p>
              </div>
            )}

            {/* Gestión de Playoffs: Agregar Partido */}
            {(tipo === 'playoff' || tipo === 'promocion') && esAdmin && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h6 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[10px] text-brand-600">+</span>
                    {modoVisual ? 'Creador Visual de Llaves' : 'Agregar Partido Manual'}
                  </h6>
                  <button 
                    type="button"
                    onClick={() => setModoVisual(!modoVisual)}
                    className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 hover:bg-brand-100 transition shadow-sm"
                  >
                    {modoVisual ? '⌨️ Modo Formulario' : '🖱️ Modo Visual (Drag & Drop)'}
                  </button>
                </div>

                {modoVisual ? (
                  <div className="space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Columna Equipos Draggable */}
                      <div className="md:w-1/3 flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-slate-200 text-[8px] text-slate-500">1</span>
                          Arrastra un Equipo
                        </label>
                        <div className="flex-1 grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                           {items.map((pf: any) => {
                              const eq = (pf?.participacionTemporada?.equipo as any);
                              const id = typeof eq === 'string' ? eq : eq?._id;
                              const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
                              const escudo = eq?.escudo;
                              const isAlreadySelected = nuevoLocal === id || nuevoVisitante === id;

                              return (
                                <div
                                  key={pf._id}
                                  draggable={!isAlreadySelected}
                                  onDragStart={() => handleDragStart(pf)}
                                  className={`group flex items-center gap-3 p-2.5 rounded-xl border text-[11px] font-black uppercase transition-all ${
                                    isAlreadySelected 
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' 
                                      : 'bg-white border-slate-200 cursor-grab hover:border-brand-400 hover:shadow-md active:scale-95 active:cursor-grabbing'
                                  }`}
                                >
                                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    {escudo ? <img src={escudo} alt={nombre} className="h-full w-full object-contain" /> : '🛡️'}
                                  </div>
                                  <span className="truncate flex-1">{nombre}</span>
                                  {!isAlreadySelected && <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">⠿</span>}
                                </div>
                              );
                           })}
                        </div>
                      </div>

                      {/* Canvas de Construcción */}
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-slate-200 text-[8px] text-slate-500">2</span>
                          Define el Encuentro
                        </label>
                        
                        <div className="flex items-center justify-center gap-6 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-700">
                           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                              <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           </div>

                           {/* Slot Local */}
                           <div 
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={() => handleDrop('local')}
                             className={`w-36 h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all relative z-10 p-2 ${
                               nuevoLocal 
                                 ? 'bg-white border-brand-500 shadow-2xl scale-105' 
                                 : 'bg-white/5 border-white/20 hover:border-brand-400 hover:bg-white/10'
                             }`}
                           >
                             {nuevoLocal ? (
                               <>
                                 <button onClick={() => setNuevoLocal('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-lg border-2 border-white hover:bg-red-600 transition-colors">✕</button>
                                 <span className="text-[9px] text-brand-600 font-black uppercase mb-1 tracking-widest">Local</span>
                                 <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-xl overflow-hidden shadow-sm">
                                      {(() => {
                                        const pFound = items.find(i => {
                                          const eq = (i.participacionTemporada as any)?.equipo;
                                          return (typeof eq === 'string' ? eq : eq?._id) === nuevoLocal;
                                        });
                                        const escudo = (pFound?.participacionTemporada as any)?.equipo?.escudo;
                                        return escudo ? <img src={escudo} alt="Escudo Local" className="w-full h-full object-contain" /> : '🏆';
                                      })()}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 text-center line-clamp-2 px-1">
                                      {(() => {
                                        const pFound = items.find(i => {
                                          const eq = (i.participacionTemporada as any)?.equipo;
                                          return (typeof eq === 'string' ? eq : eq?._id) === nuevoLocal;
                                        });
                                        const eqObj = (pFound?.participacionTemporada as any)?.equipo;
                                        return (typeof eqObj === 'string' ? eqObj : eqObj?.nombre) || 'Equipo';
                                      })()}
                                    </span>
                                 </div>
                               </>
                             ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/20">↓</div>
                                  <span className="text-[9px] text-white/30 font-black uppercase text-center tracking-widest leading-tight">Soltar<br/>Local</span>
                               </div>
                             )}
                           </div>

                           <div className="text-3xl font-black text-white italic z-10 drop-shadow-lg opacity-50">VS</div>

                           {/* Slot Visitante */}
                           <div 
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={() => handleDrop('visitante')}
                             className={`w-36 h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all relative z-10 p-2 ${
                               nuevoVisitante 
                                 ? 'bg-white border-brand-500 shadow-2xl scale-105' 
                                 : 'bg-white/5 border-white/20 hover:border-brand-400 hover:bg-white/10'
                             }`}
                           >
                             {nuevoVisitante ? (
                               <>
                                 <button onClick={() => setNuevoVisitante('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-lg border-2 border-white hover:bg-red-600 transition-colors">✕</button>
                                 <span className="text-[9px] text-brand-600 font-black uppercase mb-1 tracking-widest">Visitante</span>
                                 <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-xl overflow-hidden shadow-sm">
                                      {(() => {
                                        const pFound = items.find(i => {
                                          const eq = (i.participacionTemporada as any)?.equipo;
                                          return (typeof eq === 'string' ? eq : eq?._id) === nuevoVisitante;
                                        });
                                        const escudo = (pFound?.participacionTemporada as any)?.equipo?.escudo;
                                        return escudo ? <img src={escudo} alt="Escudo Visitante" className="w-full h-full object-contain" /> : '🛡️';
                                      })()}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 text-center line-clamp-2 px-1">
                                      {(() => {
                                        const pFound = items.find(i => {
                                          const eq = (i.participacionTemporada as any)?.equipo;
                                          return (typeof eq === 'string' ? eq : eq?._id) === nuevoVisitante;
                                        });
                                        const eqObj = (pFound?.participacionTemporada as any)?.equipo;
                                        return (typeof eqObj === 'string' ? eqObj : eqObj?.nombre) || 'Equipo';
                                      })()}
                                    </span>
                                 </div>
                               </>
                             ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/20">↓</div>
                                  <span className="text-[9px] text-white/30 font-black uppercase text-center tracking-widest leading-tight">Soltar<br/>Visitante</span>
                               </div>
                             )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                            <div className="lg:col-span-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Etapa</label>
                              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-500/20" value={nuevaEtapa} onChange={(e)=> setNuevaEtapa(e.target.value)}>
                                <option value="octavos">Octavos</option>
                                <option value="cuartos">Cuartos</option>
                                <option value="semifinal">Semifinal</option>
                                <option value="final">Final</option>
                                <option value="tercer_puesto">Tercer Puesto</option>
                                <option value="repechaje">Repechaje</option>
                              </select>
                            </div>
                            <div className="lg:col-span-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Fecha del Partido</label>
                               <input 
                                 type="date" 
                                 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold" 
                                 value={nuevaFecha} 
                                 min={fase?.fechaInicio?.split('T')[0]}
                                 max={fase?.fechaFin?.split('T')[0]}
                                 onChange={(e)=> setNuevaFecha(e.target.value)} 
                               />
                               {fase?.fechaInicio && (
                                 <p className="text-[8px] text-brand-500 mt-1 italic">Rango fase: {new Date(fase.fechaInicio).toLocaleDateString()} al {new Date(fase.fechaFin || '').toLocaleDateString()}</p>
                               )}
                            </div>
                            <div className="lg:col-span-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Hora</label>
                               <input type="time" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold" value={nuevaHora} onChange={(e)=> setNuevaHora(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-[10px] font-black uppercase text-indigo-700 hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                            disabled={!nuevoLocal || !nuevoVisitante || !nuevaFecha}
                            onClick={() => {
                              const localFound = items.find(i => (typeof (i.participacionTemporada as any)?.equipo === 'string' ? (i.participacionTemporada as any).equipo : (i.participacionTemporada as any).equipo?._id) === nuevoLocal);
                              const visitorFound = items.find(i => (typeof (i.participacionTemporada as any)?.equipo === 'string' ? (i.participacionTemporada as any).equipo : (i.participacionTemporada as any).equipo?._id) === nuevoVisitante);
                              
                              const item = {
                                localId: nuevoLocal,
                                localNombre: (localFound?.participacionTemporada as any)?.equipo?.nombre || 'Local',
                                visitanteId: nuevoVisitante,
                                visitanteNombre: (visitorFound?.participacionTemporada as any)?.equipo?.nombre || 'Visitante',
                                fecha: nuevaFecha,
                                hora: nuevaHora,
                                etapa: nuevaEtapa || 'Cuartos'
                              };
                              setPartidosEnCola([...partidosEnCola, item]);
                              setNuevoLocal(''); setNuevoVisitante('');
                            }}
                          >
                            📥 Añadir a Lista (Queue)
                          </button>
                          
                          <button
                            type="button"
                            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-[10px] font-black uppercase text-white hover:bg-brand-700 shadow-lg shadow-brand-100 transition flex items-center justify-center gap-2"
                            disabled={!nuevoLocal || !nuevoVisitante || !nuevaFecha}
                            onClick={async () => {
                              if (!fase?._id) return;
                              await crearPartidoCompetencia({ equipoLocalId: nuevoLocal, equipoVisitanteId: nuevoVisitante, fecha: nuevaFecha, hora: nuevaHora || undefined, faseId: fase._id, etapa: nuevaEtapa || undefined, modalidad: modalidadComp, categoria: categoriaComp });
                              setNuevoLocal(''); setNuevoVisitante('');
                              const lista = await getPartidosPorFase(fase._id);
                              setPartidos(lista);
                              setNotice('✨ Partido creado exitosamente'); setTimeout(()=> setNotice(''), 2000);
                              onRefresh?.();
                            }}
                          >
                            🚀 Crear Ahora
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista en Cola */}
                    {partidosEnCola.length > 0 && (
                      <div className="mt-6 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h6 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                             <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-[10px]">📋</span>
                             Partidos Listos para Generar ({partidosEnCola.length})
                          </h6>
                          <button onClick={() => setPartidosEnCola([])} className="text-[10px] text-red-500 font-bold hover:underline">Limpiar lista</button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {partidosEnCola.map((q, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl relative group">
                               <button 
                                 onClick={() => setPartidosEnCola(prev => prev.filter((_, i) => i !== idx))}
                                 className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                               >✕</button>
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">{q.etapa}</span>
                                 <span className="text-xs font-bold text-slate-800">{q.localNombre} vs {q.visitanteNombre}</span>
                               </div>
                               <div className="text-right">
                                 <span className="text-[10px] font-bold text-slate-400">{q.fecha}</span>
                               </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition flex items-center justify-center gap-3"
                          onClick={async () => {
                            if (!fase?._id) return;
                            setNotice(`Creando ${partidosEnCola.length} partidos en simultáneo...`);
                            try {
                              for (const p of partidosEnCola) {
                                await crearPartidoCompetencia({ 
                                  equipoLocalId: p.localId, 
                                  equipoVisitanteId: p.visitanteId, 
                                  fecha: p.fecha, 
                                  hora: p.hora || undefined, 
                                  faseId: fase._id, 
                                  etapa: p.etapa || undefined, 
                                  modalidad: modalidadComp, 
                                  categoria: categoriaComp 
                                });
                              }
                              setPartidosEnCola([]);
                              const lista = await getPartidosPorFase(fase._id);
                              setPartidos(lista);
                              setNotice('✅ Todos los partidos han sido creados');
                              setTimeout(() => setNotice(''), 3000);
                              onRefresh?.();
                            } catch (e) {
                              setNotice('❌ Error al crear algunos partidos');
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          Confirmar y Generar Todo el Bloque
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Equipos</label>
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20" value={nuevoLocal} onChange={(e)=> setNuevoLocal(e.target.value)}>
                        <option value="">Local…</option>
                        {items.map((pf: any) => {
                          const eq = (pf?.participacionTemporada?.equipo as any);
                          const id = typeof eq === 'string' ? eq : eq?._id;
                          const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
                          return <option key={pf._id} value={id}>{nombre}</option>;
                        })}
                      </select>
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20" value={nuevoVisitante} onChange={(e)=> setNuevoVisitante(e.target.value)}>
                        <option value="">Visitante…</option>
                        {items.map((pf: any) => {
                          const eq = (pf?.participacionTemporada?.equipo as any);
                          const id = typeof eq === 'string' ? eq : eq?._id;
                          const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
                          return <option key={pf._id} value={id}>{nombre}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Detalles</label>
                      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20" value={nuevaEtapa} onChange={(e)=> setNuevaEtapa(e.target.value)}>
                        <option value="">Etapa…</option>
                        <option value="octavos">Octavos</option>
                        <option value="cuartos">Cuartos</option>
                        <option value="semifinal">Semifinal</option>
                        <option value="final">Final</option>
                        <option value="tercer_puesto">Tercer puesto</option>
                        <option value="repechaje">Repechaje</option>
                        <option value="otro">Otro</option>
                      </select>
                      <div className="flex gap-2">
                        <input type="date" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={nuevaFecha} onChange={(e)=> setNuevaFecha(e.target.value)} />
                        <input type="time" className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={nuevaHora} onChange={(e)=> setNuevaHora(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-30 transition shadow-lg shadow-slate-300 flex items-center justify-center gap-2"
                  disabled={!nuevoLocal || !nuevoVisitante || !nuevaFecha}
                  onClick={async ()=>{
                    if (!fase?._id) return;
                    await crearPartidoCompetencia({ equipoLocalId: nuevoLocal, equipoVisitanteId: nuevoVisitante, fecha: nuevaFecha, hora: nuevaHora || undefined, faseId: fase._id, etapa: nuevaEtapa || undefined, modalidad: modalidadComp, categoria: categoriaComp });
                    setNuevoLocal(''); setNuevoVisitante(''); setNuevaFecha(''); setNuevaHora(''); setNuevaEtapa('');
                    const lista = await getPartidosPorFase(fase._id);
                    setPartidos(lista);
                    setNotice('✨ Partido creado exitosamente'); setTimeout(()=> setNotice(''), 2000);
                    onRefresh?.();
                  }}
                >
                  Confirmar y Añadir a Llave {nuevoLocal && nuevoVisitante ? '🚀' : ''}
                </button>
              </div>
            )}

            {/* Inscribir Nuevo Participante */}
            {seccionAgregarVisible && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight mb-4">Inscribir Participantes en Fase</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipos disponibles en la Temporada</label>
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedPTs.length === opcionesAgregar.length) {
                            setSelectedPTs([]);
                          } else {
                            setSelectedPTs(opcionesAgregar.map(o => o._id));
                          }
                        }}
                        className="text-[10px] font-extrabold text-brand-600 uppercase hover:underline"
                      >
                        {selectedPTs.length === opcionesAgregar.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opcionesAgregar.map(pt => {
                        const eq = (pt?.equipo as any);
                        const id = pt._id;
                        const nombre = eq?.nombre || (typeof eq === 'string' ? eq : id);
                        const escudo = eq?.escudo;
                        const isSelected = selectedPTs.includes(pt._id);

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setSelectedPTs(prev => 
                                isSelected ? prev.filter(sid => sid !== pt._id) : [...prev, pt._id]
                              );
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected 
                                ? 'bg-brand-600 border-brand-600 text-white shadow-lg scale-[1.02]' 
                                : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                              {escudo ? (
                                <img src={escudo} alt={nombre} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">🛡️</div>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-600/40 text-white">
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span className="truncate w-full leading-tight">{nombre}</span>
                                <span className={`text-[9px] font-medium ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>Disponible</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {tipo === 'grupo' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Asignar Grupo</label>
                        <input placeholder="Ej: A, B..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={grupo} onChange={(e)=>setGrupo(e.target.value)} />
                      </div>
                    )}
                    {tipo === 'liga' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Asignar División</label>
                        <input placeholder="Ej: Oro, Plata..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={division} onChange={(e)=>setDivision(e.target.value)} />
                      </div>
                    )}

                    <div className={`flex items-end ${tipo === 'grupo' || tipo === 'liga' ? 'sm:col-span-1' : 'sm:col-span-3'}`}>
                      <button
                        type="button"
                        className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-50 transition"
                        disabled={selectedPTs.length === 0}
                        onClick={async () => {
                          if (!fase?._id || selectedPTs.length === 0) return;
                          if (tipo === 'liga' && !division.trim()) { setNotice('Debe especificar una división'); setTimeout(() => setNotice(''), 3000); return; }
                          if (tipo === 'grupo' && !grupo.trim()) { setNotice('Debe especificar un grupo'); setTimeout(() => setNotice(''), 3000); return; }

                          try {
                            setNotice(`Inscribiendo ${selectedPTs.length} equipos...`);
                            for (const ptId of selectedPTs) {
                              await onAgregar(fase._id, ptId, { grupo: grupo || undefined, division: division || undefined });
                            }
                            setSelectedPTs([]); setGrupo(''); setDivision('');
                            setNotice('Equipos agregados exitosamente'); setTimeout(()=> setNotice(''), 1500);
                            onRefresh?.();
                          } catch (error) {
                            setNotice('Error al agregar algunos equipos');
                          }
                        }}
                      >
                        Inscribir {selectedPTs.length > 0 ? `(${selectedPTs.length})` : ''} Selección
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!seccionAgregarVisible && !((tipo === 'playoff' || tipo === 'promocion') && esAdmin) && (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500 font-medium italic">No hay opciones de configuración adicionales para esta fase.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ConfirmModal
        isOpen={isOpen}
        title={`Gestión de Fase: ${fase?.nombre || 'General'}`}
        message={contenido as any}
        confirmLabel="Cerrar"
        showCancel={false}
        variant="primary"
        onConfirm={onClose}
        onCancel={onClose}
        size="2xl"
      />

      <ModalInformacionPartido
        partidoId={partidoInfoId}
        isOpen={infoModalAbierto}
        onClose={async () => {
          setInfoModalAbierto(false);
          setPartidoInfoId(null);
          if (fase?._id) {
            const lista = await getPartidosPorFase(fase._id);
            setPartidos(lista);
          }
        }}
      />

      <ModalGestionSets
        partidoId={partidoSetsId || ''}
        isOpen={gestionSetsAbierto}
        onClose={async () => {
          setGestionSetsAbierto(false);
          setPartidoSetsId(null);
          if (fase?._id) {
            const lista = await getPartidosPorFase(fase._id);
            setPartidos(lista);
          }
        }}
      />

      <ModalAlineacionPartido
        partidoId={partidoAlineacionId || ''}
        isOpen={alineacionModalAbierto}
        onClose={async () => {
          setAlineacionModalAbierto(false);
          setPartidoAlineacionId(null);
          if (fase?._id) {
            const lista = await getPartidosPorFase(fase._id);
            setPartidos(lista);
          }
        }}
      />
    </>
  );
}
