import { useEffect, useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import {
  listCompetenciasByOrganizacion,
  crearCompetencia,
  BackendCompetencia,
  CrearCompetenciaPayload,
} from '../services/competenciasService';

const CompetenciasOrgPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [competencias, setCompetencias] = useState<BackendCompetencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<CrearCompetenciaPayload>>({
    modalidad: 'Foam',
    categoria: 'Mixto',
    tipo: 'liga',
  });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const refresh = async (orgId: string) => {
    setLoading(true);
    try {
      const data = await listCompetenciasByOrganizacion(orgId);
      setCompetencias(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orgId = organizacionSeleccionada?.id;
    if (!orgId) {
      setCompetencias([]);
      return;
    }
    void refresh(orgId);
  }, [organizacionSeleccionada?.id]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!organizacionSeleccionada?.id || !form.modalidad || !form.categoria || !form.fechaInicio) return;
    setCreating(true);
    try {
      await crearCompetencia({
        organizacion: organizacionSeleccionada.id,
        modalidad: form.modalidad,
        categoria: form.categoria,
        tipo: form.tipo,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        descripcion: form.descripcion,
      });
      setForm({ modalidad: 'Foam', categoria: 'Mixto', tipo: 'liga' });
      setShowForm(false);
      await refresh(organizacionSeleccionada.id);
    } finally {
      setCreating(false);
    }
  };

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una organización para gestionar sus competencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Competencias</h1>
          <p className="text-sm text-slate-500">Gestioná competencias de {organizacionSeleccionada.nombre}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition shadow-sm ${
            showForm 
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {showForm ? '✖ Cancelar' : '➕ Nueva Competencia'}
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Buscar</label>
            <input
              placeholder="Nombre o descripción"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setPage(1); }}
            >
              <option value="">Todos</option>
              <option value="en_creacion">En creación</option>
              <option value="programada">Programada</option>
              <option value="en_curso">En curso</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rounded-2xl border border-brand-200 bg-brand-50/30 p-6 shadow-card animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold text-slate-900">Crear competencia</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Modalidad</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.modalidad ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, modalidad: e.target.value as any }))}
                required
              >
                <option value="Foam">Foam</option>
                <option value="Cloth">Cloth</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.categoria ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value as any }))}
                required
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Mixto">Mixto</option>
                <option value="Libre">Libre</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.tipo ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as any }))}
              >
                <option value="liga">Liga</option>
                <option value="torneo">Torneo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.fechaInicio ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.fechaFin ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                rows={2}
                value={form.descripcion ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {creating ? 'Creando…' : 'Crear Competencia'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : (
          (() => {
            const term = busqueda.trim().toLowerCase();
            const filtradas = competencias.filter((c) => {
              const matchTexto = term ? ((c.nombre ?? '').toLowerCase().includes(term) || (c.descripcion ?? '').toLowerCase().includes(term)) : true;
              const matchEstado = estado ? (c.estado === estado) : true;
              return matchTexto && matchEstado;
            });
            const total = filtradas.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const currentPage = Math.min(page, totalPages);
            const start = (currentPage - 1) * pageSize;
            const pageItems = filtradas.slice(start, start + pageSize);
            return (
              <>
                {total === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">Sin competencias</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pageItems.map((c) => (
                      <a key={c._id} href={`/competencias/${c._id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-900">{c.nombre ?? 'Competencia'}</h3>
                        <p className="mt-1 text-sm text-slate-600">{c.modalidad ?? '—'} · {c.categoria ?? '—'}</p>
                        <p className="text-xs text-slate-500">Estado: {c.estado ?? '—'}</p>
                      </a>
                    ))}
                  </div>
                )}
                {total > pageSize ? (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <span className="text-slate-500">Página {currentPage} de {totalPages}</span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </>
            );
          })()
        )}
      </section>
    </div>
  );
};

export default CompetenciasOrgPage;
