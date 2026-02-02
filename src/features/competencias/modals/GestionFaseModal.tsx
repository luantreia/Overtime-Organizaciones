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

  const ordenEtapas = ['octavos', 'cuartos', 'semifinal', 'final', 'tercer_puesto', 'repechaje', 'otro'];
  const porEtapa = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosOrdenados) {
      const e = (p.etapa || 'otro').toString();
      if (!map[e]) map[e] = [];
      map[e].push(p);
    }
    return map;
  }, [partidosOrdenados]);

  const porGrupo = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosOrdenados) {
      const g = (p.grupo ?? '—').toString();
      if (!map[g]) map[g] = [];
      map[g].push(p);
    }
    return map;
  }, [partidosOrdenados]);

  const porDivision = useMemo(() => {
    const map: Record<string, Partido[]> = {};
    for (const p of partidosOrdenados) {
      const d = (p.division ?? '—').toString();
      if (!map[d]) map[d] = [];
      map[d].push(p);
    }
    return map;
  }, [partidosOrdenados]);

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
        
        <div className="flex flex-col items-center px-2">
          <span className="text-xl font-black text-slate-900 italic">VS</span>
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
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Tipo</span>
          <span className="text-xs font-extrabold text-slate-900 uppercase bg-slate-200/50 px-2 py-0.5 rounded-md mt-1 italic">{tipo || '—'}</span>
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
            {partidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <span className="text-4xl mb-3">📅</span>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No hay partidos programados</p>
                <p className="text-xs text-slate-400 mt-1">Crea partidos manualmente o genera la llave en playoffs.</p>
              </div>
            ) : (
              <>
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
                <h6 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[10px] text-brand-600">+</span>
                  Agregar Partido Manual
                </h6>
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
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-30 transition shadow-lg shadow-slate-200"
                  disabled={!nuevoLocal || !nuevoVisitante || !nuevaFecha}
                  onClick={async ()=>{
                    if (!fase?._id) return;
                    await crearPartidoCompetencia({ equipoLocalId: nuevoLocal, equipoVisitanteId: nuevoVisitante, fecha: nuevaFecha, hora: nuevaHora || undefined, faseId: fase._id, etapa: nuevaEtapa || undefined, modalidad: modalidadComp, categoria: categoriaComp });
                    setNuevoLocal(''); setNuevoVisitante(''); setNuevaFecha(''); setNuevaHora(''); setNuevaEtapa('');
                    const lista = await getPartidosPorFase(fase._id);
                    setPartidos(lista);
                    setNotice('Partido creado exitosamente'); setTimeout(()=> setNotice(''), 1200);
                    onRefresh?.();
                  }}
                >
                  Confirmar Partido
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
                      {opcionesAgregar.map((pt) => {
                        const isSelected = selectedPTs.includes(pt._id);
                        return (
                          <button
                            key={pt._id}
                            type="button"
                            onClick={() => {
                              setSelectedPTs(prev => 
                                isSelected ? prev.filter(id => id !== pt._id) : [...prev, pt._id]
                              );
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                              isSelected 
                                ? 'bg-brand-600 border-brand-600 text-white shadow-md' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-brand-300'
                            }`}
                          >
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'bg-white border-white text-brand-600' : 'border-slate-300 bg-slate-50'}`}>
                              {isSelected && '✓'}
                            </span>
                            <span className="truncate">{typeof pt.equipo === 'string' ? pt.equipo : (pt.equipo as any)?.nombre || pt._id}</span>
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
