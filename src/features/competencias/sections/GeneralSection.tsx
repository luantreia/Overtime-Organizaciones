import type { AdminUser } from '../services';

type Props = {
  nombre: string;
  setNombre: (v: string) => void;
  modalidad: 'Foam' | 'Cloth' | '';
  setModalidad: (v: 'Foam' | 'Cloth' | '') => void;
  categoria: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '';
  setCategoria: (v: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '') => void;
  tipo: 'liga' | 'torneo' | 'otro' | '';
  setTipo: (v: 'liga' | 'torneo' | 'otro' | '') => void;
  fechaInicio: string;
  setFechaInicio: (v: string) => void;
  fechaFin: string;
  setFechaFin: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  rankedEnabled: boolean;
  setRankedEnabled: (v: boolean) => void;
  esAdmin: boolean;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  adminEmail: string;
  setAdminEmail: (v: string) => void;
  admins: AdminUser[];
  onAgregarAdmin: (e: React.FormEvent) => void;
  onQuitarAdmin: (id: string) => void;
  onEliminarCompetenciaRequested: () => void;
};

export default function GeneralSection(props: Props) {
  const {
    nombre, setNombre,
    modalidad, setModalidad,
    categoria, setCategoria,
    tipo, setTipo,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    descripcion, setDescripcion,
    rankedEnabled, setRankedEnabled,
    esAdmin, saving, onSubmit,
    adminEmail, setAdminEmail,
    admins, onAgregarAdmin, onQuitarAdmin,
    onEliminarCompetenciaRequested,
  } = props;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Datos de la competencia</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={nombre} onChange={(e)=>setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Modalidad</label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={modalidad} onChange={(e)=>setModalidad(e.target.value as any)}>
              <option value="">—</option>
              <option value="Foam">Foam</option>
              <option value="Cloth">Cloth</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={categoria} onChange={(e)=>setCategoria(e.target.value as any)}>
              <option value="">—</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
              <option value="Libre">Libre</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={tipo} onChange={(e)=>setTipo(e.target.value as any)}>
              <option value="">—</option>
              <option value="liga">Liga</option>
              <option value="torneo">Torneo</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
            <textarea className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" rows={2} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} />
          </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">Ranked (opt-in por competencia)</label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={rankedEnabled} onChange={(e)=>setRankedEnabled(e.target.checked)} />
                <span>Habilitar pestaña Ranked y ranking por competencia</span>
              </label>
            </div>
          <div className="md:col-span-3 flex items-center justify-between">
            <button disabled={!esAdmin || saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50" type="submit">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" disabled={!esAdmin} onClick={onEliminarCompetenciaRequested} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
              Eliminar competencia
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Administradores</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onAgregarAdmin}>
          <input type="email" placeholder="email@ejemplo.com" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} />
          <button disabled={!esAdmin} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50" type="submit">Agregar</button>
        </form>
        <ul className="mt-4 divide-y divide-slate-200">
          {admins.map(a => (
            <li key={a._id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{a.nombre ?? a.email ?? a._id}</p>
                <p className="truncate text-xs text-slate-500">{a.email ?? '—'}</p>
              </div>
              <button type="button" disabled={!esAdmin} onClick={()=>onQuitarAdmin(a._id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Quitar</button>
            </li>
          ))}
          {admins.length === 0 ? <li className="py-2 text-xs text-slate-500">Sin administradores</li> : null}
        </ul>
      </div>
    </section>
  );
}
