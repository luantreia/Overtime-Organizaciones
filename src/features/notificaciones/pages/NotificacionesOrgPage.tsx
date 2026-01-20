import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSolicitudesEdicion, actualizarSolicitudEdicion, getSolicitudAprobadores } from '../../../shared/features/solicitudes/services/solicitudesEdicionService';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import SolicitudEditModalSimple from '../../../shared/features/solicitudes/components/SolicitudEditModalSimple';
import type { SolicitudEdicion, SolicitudEdicionTipo, SolicitudEdicionEstado } from '../../../shared/features/solicitudes/types/solicitudesEdicion';

// Página de notificaciones específica para Organizaciones (con filtro de organizaciones)

const categoriaDeTipo = (tipo: SolicitudEdicionTipo): string => {
  if (
    tipo === 'usuario-crear-jugador' ||
    tipo === 'usuario-crear-equipo' ||
    tipo === 'usuario-crear-organizacion' ||
    tipo === 'usuario-solicitar-admin-jugador' ||
    tipo === 'usuario-solicitar-admin-equipo' ||
    tipo === 'usuario-solicitar-admin-organizacion'
  ) return 'Solicitudes de usuarios';

  if (
    tipo === 'participacion-temporada-crear' ||
    tipo === 'participacion-temporada-actualizar' ||
    tipo === 'participacion-temporada-eliminar'
  ) return 'Participaciones Temporada';

  if (
    tipo === 'jugador-temporada-crear' ||
    tipo === 'jugador-temporada-actualizar' ||
    tipo === 'jugador-temporada-eliminar'
  ) return 'Participaciones Jugador-Temporada';

  return 'NO_PERMITIDO';
};

const labelTipo = (t: SolicitudEdicionTipo) => {
  const map: Partial<Record<SolicitudEdicionTipo, string>> = {
    'usuario-crear-jugador': 'Usuario: Crear jugador',
    'usuario-crear-equipo': 'Usuario: Crear equipo',
    'usuario-crear-organizacion': 'Usuario: Crear organización',
    'usuario-solicitar-admin-jugador': 'Usuario: Solicitar admin de jugador',
    'usuario-solicitar-admin-equipo': 'Usuario: Solicitar admin de equipo',
    'usuario-solicitar-admin-organizacion': 'Usuario: Solicitar admin de organización',
    'participacion-temporada-crear': 'Participación Temporada: crear',
    'participacion-temporada-actualizar': 'Participación Temporada: actualizar',
    'participacion-temporada-eliminar': 'Participación Temporada: eliminar',
    'jugador-temporada-crear': 'Participación Jugador-Temporada: crear',
    'jugador-temporada-actualizar': 'Participación Jugador-Temporada: actualizar',
    'jugador-temporada-eliminar': 'Participación Jugador-Temporada: eliminar',
  };
  return map[t] ?? t;
};

export default function NotificacionesPage() {
  const { addToast } = useToast();
  const { organizacionSeleccionada } = useOrganizacion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudEdicion[]>([]);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rechazoEdit, setRechazoEdit] = useState<{ id: string; motivo: string } | null>(null);
  const [openSolicitud, setOpenSolicitud] = useState<null | SolicitudEdicion>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Filtros de UI
  const [fEstado, setFEstado] = useState<SolicitudEdicionEstado | 'todos'>(
    (searchParams.get('estado') as SolicitudEdicionEstado) || 'pendiente'
  );
  const [fCategoria, setFCategoria] = useState<string>(searchParams.get('categoria') || 'Todas');
  const [q, setQ] = useState<string>(searchParams.get('q') || '');
  const [fMostrarSoloMias, setFMostrarSoloMias] = useState<boolean>(
    searchParams.get('soloMias') === 'true'
  );
  const [fEntidad] = useState<string>(searchParams.get('entidad') || 'todas');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Si hay estado distinto a 'todos', consultar ya filtrado en backend
      const params: any = {};
      if (fEstado !== 'todos') params.estado = fEstado;
      params.scope = fMostrarSoloMias ? 'mine' : 'related';
      if (organizacionSeleccionada) params.entidad = organizacionSeleccionada.id;
      
      const data = await getSolicitudesEdicion(params);
      const allowedTipos = new Set<SolicitudEdicionTipo>([
        'usuario-crear-jugador','usuario-crear-equipo','usuario-crear-organizacion',
        'usuario-solicitar-admin-jugador','usuario-solicitar-admin-equipo','usuario-solicitar-admin-organizacion',
        'participacion-temporada-crear','participacion-temporada-actualizar','participacion-temporada-eliminar',
        'jugador-temporada-crear','jugador-temporada-actualizar','jugador-temporada-eliminar'
      ]);
      const filtradas = data.solicitudes.filter((s: any) => allowedTipos.has(s.tipo));
      setSolicitudes(filtradas.map((s: any) => ({ ...s, id: s._id })));
    } catch (e: any) {
      setError(e?.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }, [fEstado, fMostrarSoloMias, organizacionSeleccionada]);

  useEffect(() => { void cargar(); }, [cargar]);

  // Auto-refresh cada 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => { void cargar(); }, 30000);
    return () => window.clearInterval(id);
  }, [autoRefresh, cargar]);

  // Sync URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (fEstado && fEstado !== 'todos') sp.set('estado', fEstado);
    if (fCategoria && fCategoria !== 'Todas') sp.set('categoria', fCategoria);
    if (q) sp.set('q', q);
    if (fMostrarSoloMias) sp.set('soloMias', 'true');
    if (fEntidad && fEntidad !== 'todas') sp.set('entidad', fEntidad);
    setSearchParams(sp, { replace: true });
  }, [fEstado, fCategoria, q, fMostrarSoloMias, fEntidad, setSearchParams]);

  const filtradas = useMemo(() => {
    const byCat = (s: SolicitudEdicion) => {
      const cat = categoriaDeTipo(s.tipo);
      if (cat === 'NO_PERMITIDO') return false;
      return fCategoria === 'Todas' ? true : cat === fCategoria;
    };
    const byQ = (s: SolicitudEdicion) => {
      if (!q) return true;
      const txt = `${s.tipo} ${labelTipo(s.tipo)} ${JSON.stringify(s.datosPropuestos || {})}`.toLowerCase();
      return txt.includes(q.toLowerCase());
    };
    return solicitudes.filter((s) => byCat(s) && byQ(s));
  }, [solicitudes, fCategoria, q]);

  // Paginación simple en cliente
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  useEffect(() => { setPage(1); }, [fCategoria, q, fEstado, fMostrarSoloMias, fEntidad]);

  const manejarAprobar = async (s: SolicitudEdicion) => {
    try {
      setAccionando(s._id);
      const updated = await actualizarSolicitudEdicion(s._id, { estado: 'aceptado' });
      setSolicitudes((prev) => prev.map((x) => (x._id === s._id ? { ...updated, id: updated._id } : x)));
      addToast({ type: 'success', title: 'Solicitud aprobada' });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error al aprobar', message: e?.message || 'No se pudo aprobar' });
    } finally {
      setAccionando(null);
    }
  };

  const manejarRechazar = async (s: SolicitudEdicion) => {
    if (!rechazoEdit || rechazoEdit.id !== s._id || !rechazoEdit.motivo.trim()) {
      addToast({ type: 'info', title: 'Ingresá un motivo', message: 'Escribí un motivo y confirmá' });
      return;
    }
    try {
      setAccionando(s._id);
      const updated = await actualizarSolicitudEdicion(s._id, { estado: 'rechazado', motivoRechazo: rechazoEdit.motivo.trim() });
      setSolicitudes((prev) => prev.map((x) => (x._id === s._id ? { ...updated, id: updated._id } : x)));
      setRechazoEdit(null);
      addToast({ type: 'success', title: 'Solicitud rechazada' });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error al rechazar', message: e?.message || 'No se pudo rechazar' });
    } finally {
      setAccionando(null);
    }
  };

  const handleOpenEditar = (s: SolicitudEdicion) => {
    setOpenSolicitud(s);
  };

  const handleSaved = (updated: SolicitudEdicion) => {
    setSolicitudes((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
  };

  const categorias = useMemo(() => {
    const grupos: Record<string, SolicitudEdicion[]> = {};
    for (const s of filtradas) {
      const cat = categoriaDeTipo(s.tipo);
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(s);
    }
    return grupos;
  }, [filtradas]);

  return (
    <>
      <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>
        <p className="text-sm text-slate-500">
          Gestioná las solicitudes de edición y creación de {organizacionSeleccionada?.nombre}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
            <select 
              value={fEstado} 
              onChange={(e) => setFEstado(e.target.value as any)} 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
            <select 
              value={fCategoria} 
              onChange={(e) => setFCategoria(e.target.value)} 
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option>Todas</option>
              <option>Solicitudes de usuarios</option>
              <option>Participaciones Temporada</option>
              <option>Participaciones Jugador-Temporada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por contenido…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => void cargar()} 
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
            >
              🔄 Recargar
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={fMostrarSoloMias} 
              onChange={(e) => setFMostrarSoloMias(e.target.checked)} 
            />
            Solo mis solicitudes
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            Auto-refresh 30s
          </label>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">{error}</div>
      ) : (
        Object.entries(categorias).map(([cat, items]) => (
          <section key={cat} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{cat}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{items.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Creado</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((s) => (
                    <React.Fragment key={s._id}>
                      <tr className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          <button onClick={() => setExpanded((prev) => ({ ...prev, [s._id]: !prev[s._id] }))} className="mr-2 text-brand-600 hover:underline">
                            {expanded[s._id] ? 'Ocultar' : 'Ver'}
                          </button>
                          {labelTipo(s.tipo)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${s.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' : s.estado === 'aceptado' ? 'bg-emerald-100 text-emerald-800' : s.estado === 'rechazado' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{s.estado}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <AprobarButton solicitud={s} accionando={accionando} onAprobar={() => void manejarAprobar(s)} />
                            <button
                              onClick={() => handleOpenEditar(s)}
                              className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            {rechazoEdit?.id === s._id ? (
                              <>
                                <input
                                  value={rechazoEdit.motivo}
                                  onChange={(e) => setRechazoEdit({ id: s._id, motivo: e.target.value })}
                                  placeholder="Motivo"
                                  className="w-40 rounded border border-slate-300 px-2 py-1 text-xs"
                                />
                                <button
                                  disabled={accionando === s._id || s.estado !== 'pendiente'}
                                  onClick={() => void manejarRechazar(s)}
                                  className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-300"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setRechazoEdit(null)}
                                  className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                disabled={accionando === s._id || s.estado !== 'pendiente'}
                                onClick={() => setRechazoEdit({ id: s._id, motivo: '' })}
                                className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-300"
                              >
                                Rechazar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded[s._id] ? (
                        <tr className="border-t border-slate-100 bg-slate-50/50">
                          <td colSpan={4} className="px-3 py-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-2 text-xs font-semibold text-slate-500">Datos propuestos</p>
                              <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700">{JSON.stringify(s.datosPropuestos || {}, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <span className="text-slate-500">Página {page} de {totalPages}</span>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </section>
        ))
      )}
      </div>
      {openSolicitud ? (
      <SolicitudEditModalSimple
        solicitud={openSolicitud}
        onClose={() => setOpenSolicitud(null)}
        onSaved={handleSaved}
      />
      ) : null}
    </>
  );
}

interface AprobarButtonProps { solicitud: SolicitudEdicion; accionando: string | null; onAprobar: () => void; }
const AprobarButton: React.FC<AprobarButtonProps> = ({ solicitud, accionando, onAprobar }) => {
  const { addToast } = useToast();
  const [puedeAprobar, setPuedeAprobar] = useState<boolean | null>(null);
  const [loadingAprobadores, setLoadingAprobadores] = useState(false);

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      if (solicitud.estado !== 'pendiente') return;
      setLoadingAprobadores(true);
      try {
        const res: any = await getSolicitudAprobadores(solicitud._id);
        setPuedeAprobar(res?.puedeAprobar ?? false);
      } catch {
        if (mounted) setPuedeAprobar(false);
      } finally {
        if (mounted) setLoadingAprobadores(false);
      }
    };
    cargar();
    return () => { mounted = false; };
  }, [solicitud._id, solicitud.estado]);

  const handleClick = () => {
    if (!puedeAprobar) {
      addToast({ type: 'info', title: 'No autorizado', message: 'No estás habilitado para aprobar esta solicitud.' });
      return;
    }
    onAprobar();
  };

  return (
    <button
      disabled={accionando === solicitud._id || solicitud.estado !== 'pendiente' || loadingAprobadores}
      onClick={handleClick}
      className={`rounded px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed ${puedeAprobar === false ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      title={puedeAprobar === false ? 'No podes aprobar' : 'Aprobar solicitud'}
    >
      {loadingAprobadores ? '...' : 'Aprobar'}
    </button>
  );
};
