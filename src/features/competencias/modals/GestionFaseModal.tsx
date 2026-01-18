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
};

export default function GestionParticipantesFaseModal({ isOpen, onClose, esAdmin, fase, temporadaId, participantesFase, participantesTemporada, onAgregar, onGenerarLlave }: Props) {
  const [seleccionPT, setSeleccionPT] = useState('');
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
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
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

  const contenido = (
    <div className="max-h-[80vh] overflow-y-auto space-y-6">
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium">
          {notice}
        </div>
      ) : null}

      {/* Sección Participantes */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Participantes de la Fase</h3>
        {tipo === 'liga' ? (
          <FaseLigaSection
            participantes={items}
            esAdmin={esAdmin}
            onUpdate={async (id: string, body: Partial<{ division: string }>) => {
              await updateParticipacionFase(id, body);
              setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p));
              setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200);
            }}
            onDelete={async (id: string) => {
              if (!window.confirm('¿Eliminar este participante de la fase?')) return;
              await deleteParticipacionFase(id);
              setItems((prev)=> prev.filter(p=> p._id !== id));
              setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
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
            }}
            onDelete={async (id: string) => {
              if (!window.confirm('¿Eliminar este participante de la fase?')) return;
              await deleteParticipacionFase(id);
              setItems((prev)=> prev.filter(p=> p._id !== id));
              setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
            }}
          />
        ) : (tipo === 'playoff' || tipo === 'promocion') ? (
          <>
            <FasePlayoffSection
              participantes={items}
              esAdmin={esAdmin}
              onUpdate={async (id: string, body: Partial<{ seed: number; posicion: number }>) => {
                await updateParticipacionFase(id, body);
                setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p));
                setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200);
              }}
              onDelete={async (id: string) => {
                if (!window.confirm('¿Eliminar este participante de la fase?')) return;
                await deleteParticipacionFase(id);
                setItems((prev)=> prev.filter(p=> p._id !== id));
                setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200);
              }}
            />
            {esAdmin ? (
              <div className="flex justify-end pt-4">
                <button type="button" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition" onClick={() => { if (fase?._id) { void onGenerarLlave?.(fase._id); } }}>Generar Llave</button>
              </div>
            ) : null}
          </>
        ) : (
          <FaseGruposSection participantes={items} esAdmin={esAdmin} onUpdate={async (id: string, body: Partial<{ grupo: string }>) => { await updateParticipacionFase(id, body); setItems((prev)=> prev.map(p=> p._id===id ? ({...p, ...body} as any) : p)); setNotice('Cambios guardados'); setTimeout(()=> setNotice(''), 1200); }} onDelete={async (id: string) => { if (!window.confirm('¿Eliminar este participante de la fase?')) return; await deleteParticipacionFase(id); setItems((prev)=> prev.filter(p=> p._id !== id)); setNotice('Participante eliminado'); setTimeout(()=> setNotice(''), 1200); }} />
        )}
      </section>

      {/* Sección Partidos */}
      <section className="space-y-4">
        <details className="group">
          <summary className="cursor-pointer text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 group-open:border-brand-500 transition">
            Partidos de la Fase
            <span className="ml-2 text-sm text-slate-500">({partidos.length} partidos)</span>
          </summary>
          <div className="mt-4 space-y-4">
            {(tipo === 'playoff' || tipo === 'promocion') && Object.keys(porEtapa).length > 0 ? (
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-3">Bracket por Etapa</h5>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ordenEtapas.filter(e => porEtapa[e]?.length).map((e) => (
                    <div key={e} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold capitalize text-slate-700 mb-3">{e.replace('_', ' ')}</p>
                      <ul className="space-y-3">
                        {porEtapa[e].map((p) => (
                          <li key={p.id} className="rounded border border-slate-100 bg-slate-50 p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="truncate pr-2 font-medium">{p.localNombre || 'Local'}</span>
                              <span className="text-slate-400 text-xs">vs</span>
                              <span className="truncate pl-2 font-medium">{p.visitanteNombre || p.rival || 'Visitante'}</span>
                              <div className="relative ml-2">
                                <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-100 transition" onClick={(e)=>{ e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === p.id ? null : p.id); }}>
                                  ⋯
                                </button>
                                {menuAbiertoId === p.id ? (
                                  <div className="absolute right-0 z-10 mt-1 w-40 rounded border border-slate-200 bg-white shadow-lg">
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoInfoId(p.id); setInfoModalAbierto(true); setMenuAbiertoId(null); }}>Información</button>
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoSetsId(p.id); setGestionSetsAbierto(true); setMenuAbiertoId(null); }}>Gestionar Sets</button>
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoAlineacionId(p.id); setAlineacionModalAbierto(true); setMenuAbiertoId(null); }}>Alineación</button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">{p.fecha}{p.hora ? ` ${p.hora}` : ''} · {p.estado}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Lista por Fecha (Agrupada)</h5>
              <div className="space-y-4">
                {(tipo === 'grupo' ? Object.entries(porGrupo) : tipo === 'liga' ? Object.entries(porDivision) : (Object.keys(porGrupo).some(k => k !== '—') ? Object.entries(porGrupo) : Object.entries(porDivision)))
                  .map(([key, arr]) => (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-700 mb-3">{tipo === 'grupo' ? `Grupo ${key}` : tipo === 'liga' ? `División ${key}` : (key !== '—' ? `Grupo ${key}` : 'General')}</p>
                      <ul className="divide-y divide-slate-100">
                        {arr.map((p) => (
                          <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                            <span className="truncate pr-2 flex-1">{p.localNombre || 'Local'} vs {p.visitanteNombre || p.rival || 'Visitante'}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-xs">{p.fecha}{p.hora ? ` ${p.hora}` : ''}</span>
                              <span className="text-xs text-slate-400">{p.estado}</span>
                              <div className="relative">
                                <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-100 transition" onClick={(e)=>{ e.stopPropagation(); setMenuAbiertoId(menuAbiertoId === p.id ? null : p.id); }}>
                                  ⋯
                                </button>
                                {menuAbiertoId === p.id ? (
                                  <div className="absolute right-0 z-10 mt-1 w-40 rounded border border-slate-200 bg-white shadow-lg">
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoInfoId(p.id); setInfoModalAbierto(true); setMenuAbiertoId(null); }}>Información</button>
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoSetsId(p.id); setGestionSetsAbierto(true); setMenuAbiertoId(null); }}>Gestionar Sets</button>
                                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{ setPartidoAlineacionId(p.id); setAlineacionModalAbierto(true); setMenuAbiertoId(null); }}>Alineación</button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                        {arr.length === 0 ? (
                          <li className="py-3 text-sm text-slate-500">Sin partidos</li>
                        ) : null}
                      </ul>
                    </div>
                ))}
              </div>
            </div>

            {/* Agregar partido en playoffs */}
            {(tipo === 'playoff' || tipo === 'promocion') && esAdmin ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h6 className="text-sm font-semibold text-slate-700 mb-3">Agregar Partido</h6>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <select className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" value={nuevoLocal} onChange={(e)=> setNuevoLocal(e.target.value)}>
                    <option value="">Local…</option>
                    {items.map((pf: any) => {
                      const eq = (pf?.participacionTemporada?.equipo as any);
                      const id = typeof eq === 'string' ? eq : eq?._id;
                      const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
                      return <option key={pf._id} value={id}>{nombre}</option>;
                    })}
                  </select>
                  <select className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" value={nuevoVisitante} onChange={(e)=> setNuevoVisitante(e.target.value)}>
                    <option value="">Visitante…</option>
                    {items.map((pf: any) => {
                      const eq = (pf?.participacionTemporada?.equipo as any);
                      const id = typeof eq === 'string' ? eq : eq?._id;
                      const nombre = typeof eq === 'string' ? eq : (eq?.nombre || id);
                      return <option key={pf._id} value={id}>{nombre}</option>;
                    })}
                  </select>
                  <select className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" value={nuevaEtapa} onChange={(e)=> setNuevaEtapa(e.target.value)}>
                    <option value="">Etapa…</option>
                    <option value="octavos">Octavos</option>
                    <option value="cuartos">Cuartos</option>
                    <option value="semifinal">Semifinal</option>
                    <option value="final">Final</option>
                    <option value="tercer_puesto">Tercer puesto</option>
                    <option value="repechaje">Repechaje</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input type="date" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" value={nuevaFecha} onChange={(e)=> setNuevaFecha(e.target.value)} />
                  <input type="time" className="rounded border border-slate-200 bg-white px-3 py-2 text-sm" value={nuevaHora} onChange={(e)=> setNuevaHora(e.target.value)} />
                  <button
                    type="button"
                    className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition"
                    disabled={!nuevoLocal || !nuevoVisitante || !nuevaFecha}
                    onClick={async ()=>{
                      if (!fase?._id) return;
                      await crearPartidoCompetencia({ equipoLocalId: nuevoLocal, equipoVisitanteId: nuevoVisitante, fecha: nuevaFecha, hora: nuevaHora || undefined, faseId: fase._id, etapa: nuevaEtapa || undefined, modalidad: modalidadComp, categoria: categoriaComp });
                      setNuevoLocal(''); setNuevoVisitante(''); setNuevaFecha(''); setNuevaHora(''); setNuevaEtapa('');
                      const lista = await getPartidosPorFase(fase._id);
                      setPartidos(lista);
                      setNotice('Partido creado'); setTimeout(()=> setNotice(''), 1200);
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </details>
      </section>

      {/* Agregar Participante */}
      {seccionAgregarVisible ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Agregar Participante</h3>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <select
                className="sm:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={seleccionPT}
                onChange={(e) => setSeleccionPT(e.target.value)}
              >
                <option value="">Seleccionar participante…</option>
                {opcionesAgregar.map((pt) => (
                  <option key={pt._id} value={pt._id}>{typeof pt.equipo === 'string' ? pt.equipo : (pt.equipo as any)?.nombre || pt._id}</option>
                ))}
              </select>
              {tipo === 'grupo' ? (
                <input placeholder="Grupo" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={grupo} onChange={(e)=>setGrupo(e.target.value)} />
              ) : null}
              {tipo === 'liga' ? (
                <input placeholder="División" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={division} onChange={(e)=>setDivision(e.target.value)} />
              ) : null}
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition"
                disabled={!seleccionPT}
                onClick={async () => {
                  if (!fase?._id || !seleccionPT) return;

                  // Validación para fase tipo liga: requiere división
                  if (tipo === 'liga' && !division.trim()) {
                    setNotice('Debe especificar una división para fases tipo liga');
                    setTimeout(() => setNotice(''), 3000);
                    return;
                  }

                  // Validación para fase tipo grupo: requiere grupo
                  if (tipo === 'grupo' && !grupo.trim()) {
                    setNotice('Debe especificar un grupo para fases tipo grupo');
                    setTimeout(() => setNotice(''), 3000);
                    return;
                  }

                  await onAgregar(fase._id, seleccionPT, { grupo: grupo || undefined, division: division || undefined });
                  setSeleccionPT('');
                  setGrupo('');
                  setDivision('');
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );

  return (
    <>
      <ConfirmModal
        isOpen={isOpen}
        title={`Participantes de fase${fase?.nombre ? `: ${fase.nombre}` : ''}`}
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
