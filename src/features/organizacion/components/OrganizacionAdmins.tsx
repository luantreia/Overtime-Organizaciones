import { useEffect, useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { addOrganizacionAdministrador, getOrganizacionAdministradores, removeOrganizacionAdministrador, type AdminUser } from '../services/organizacionService';

const OrganizacionAdmins = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    if (!organizacionSeleccionada?.id) {
      setAdmins([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizacionAdministradores(organizacionSeleccionada.id);
      setAdmins(data.administradores || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacionSeleccionada?.id]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizacionSeleccionada?.id || !email.trim()) return;
    setSubmitting(true);
    try {
      await addOrganizacionAdministrador(organizacionSeleccionada.id, { email });
      setEmail('');
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (adminId: string) => {
    if (!organizacionSeleccionada?.id) return;
    await removeOrganizacionAdministrador(organizacionSeleccionada.id, adminId);
    await refresh();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">Administradores</h2>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onAdd}>
        <input
          type="email"
          placeholder="email@ejemplo.com"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Agregando…' : 'Agregar'}
        </button>
      </form>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : admins.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">Sin administradores</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {admins.map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{a.nombre ?? a.email ?? a._id}</p>
                  <p className="truncate text-xs text-slate-500">{a.email ?? '—'}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => onRemove(a._id)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OrganizacionAdmins;
