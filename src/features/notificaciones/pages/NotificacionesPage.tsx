import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSolicitudes, actualizarSolicitud } from '../../solicitudes/services/solicitudesEdicionService';
import type { SolicitudEdicion, SolicitudEdicionEstado, SolicitudEdicionTipo } from '../../../types/solicitudesEdicion';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import SolicitudEditModal from '../../solicitudes/components/SolicitudEditModal';

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
    tipo === 'participacion-temporada-eliminar' ||
    tipo === 'jugador-temporada-crear' ||
    tipo === 'jugador-temporada-actualizar' ||
    tipo === 'jugador-temporada-eliminar'
  ) return 'Participaciones';

  if (
    tipo === 'resultadoPartido' ||
    tipo === 'resultadoSet' ||
    tipo === 'estadisticasJugadorSet' ||
    tipo === 'estadisticasJugadorPartido' ||
    tipo === 'estadisticasEquipoPartido' ||
    tipo === 'estadisticasEquipoSet'
  ) return 'Partidos';

  return 'Otras';
};

const labelTipo = (t: SolicitudEdicionTipo) => {
  const map: Partial<Record<SolicitudEdicionTipo, string>> = {
    'usuario-crear-jugador': 'Usuario: Crear jugador',
    'usuario-crear-equipo': 'Usuario: Crear equipo',
    'usuario-crear-organizacion': 'Usuario: Crear organización',
    'usuario-solicitar-admin-jugador': 'Usuario: Solicitar admin de jugador',
    'usuario-solicitar-admin-equipo': 'Usuario: Solicitar admin de equipo',
    'usuario-solicitar-admin-organizacion': 'Usuario: Solicitar admin de organización',
    'participacion-temporada-crear': 'Participación: Temporada (crear)',
    'participacion-temporada-actualizar': 'Participación: Temporada (actualizar)',
    'participacion-temporada-eliminar': 'Participación: Temporada (eliminar)',
    'jugador-temporada-crear': 'Participación: Jugador-Temporada (crear)',
    'jugador-temporada-actualizar': 'Participación: Jugador-Temporada (actualizar)',
    'jugador-temporada-eliminar': 'Participación: Jugador-Temporada (eliminar)',
    'resultadoPartido': 'Partido: Resultado',
    'resultadoSet': 'Set: Resultado',
  };
  return map[t] ?? t;
};

export default function NotificacionesPage() {
  const { addToast } = useToast();
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

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Si hay estado distinto a 'todos', consultar ya filtrado en backend
      const params = fEstado !== 'todos' ? { estado: fEstado } : {};
      const data = await getSolicitudes(params as any);
      setSolicitudes(data);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }, [fEstado]);

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
    setSearchParams(sp, { replace: true });
  }, [fEstado, fCategoria, q, setSearchParams]);

  const filtradas = useMemo(() => {
    const byCat = (s: SolicitudEdicion) => (fCategoria === 'Todas' ? true : categoriaDeTipo(s.tipo) === fCategoria);
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
  useEffect(() => { setPage(1); }, [fCategoria, q, fEstado]);

  const manejarAprobar = async (s: SolicitudEdicion) => {
    try {
      setAccionando(s._id);
      const updated = await actualizarSolicitud(s._id, { estado: 'aceptado' });
      setSolicitudes((prev) => prev.map((x) => (x._id === s._id ? updated : x)));
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
      const updated = await actualizarSolicitud(s._id, { estado: 'rechazado', motivoRechazo: rechazoEdit.motivo.trim() });
      setSolicitudes((prev) => prev.map((x) => (x._id === s._id ? updated : x)));
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
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500">Gestioná todas las solicitudes por categoría.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value as any)} className="rounded-lg border-slate-300 text-sm">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aceptado">Aceptado</option>
            <option value="rechazado">Rechazado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} className="rounded-lg border-slate-300 text-sm">
            <option>Todas</option>
            <option>Solicitudes de usuarios</option>
            <option>Participaciones</option>
            <option>Partidos</option>
            <option>Otras</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-48 rounded-lg border-slate-300 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh 30s
          </label>
          <button onClick={() => void cargar()} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Recargar</button>
        </div>
      </header>

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
                            <button
                              disabled={accionando === s._id || s.estado !== 'pendiente'}
                              onClick={() => void manejarAprobar(s)}
                              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                              Aprobar
                            </button>
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
                            <div className="space-y-3">
                              <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-slate-500">Datos propuestos</p>
                                <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700">{JSON.stringify(s.datosPropuestos || {}, null, 2)}</pre>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="font-semibold text-slate-500">Creado por</p>
                                  <p className="text-slate-700">{s.creadoPor || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-500">Aprobado por</p>
                                  <p className="text-slate-700">{s.aprobadoPor || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-500">Fecha creación</p>
                                  <p className="text-slate-700">{new Date(s.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-500">Fecha aceptación</p>
                                  <p className="text-slate-700">{s.fechaAceptacion ? new Date(s.fechaAceptacion).toLocaleString() : 'N/A'}</p>
                                </div>
                              </div>
                              {s.motivoRechazo ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                                  <p className="mb-2 text-xs font-semibold text-rose-700">Motivo de rechazo</p>
                                  <p className="text-xs text-rose-800">{s.motivoRechazo}</p>
                                </div>
                              ) : null}
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
      <SolicitudEditModal
        solicitud={openSolicitud}
        onClose={() => setOpenSolicitud(null)}
        onSaved={handleSaved}
      />
      ) : null}
    </>
  );
}
