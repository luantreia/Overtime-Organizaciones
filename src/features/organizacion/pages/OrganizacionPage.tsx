import { useState, useEffect } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import ModalGestionAdministradoresEntidad from '../../../shared/components/modalGestionAdministradoresEntidad/ModalGestionAdministradoresEntidad';
import { 
  addOrganizacionAdministrador, 
  getOrganizacionAdministradores, 
  removeOrganizacionAdministrador,
  updateOrganizacion 
} from '../services/organizacionService';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useOrgPermissions } from '../hooks/useOrgPermissions';
import GestionMiembros from '../components/GestionMiembros';

const OrganizacionPage = () => {
  const { organizacionSeleccionada, recargarOrganizaciones } = useOrganizacion();
  const { addToast } = useToast();
  const { can, loading: permissionsLoading } = useOrgPermissions(organizacionSeleccionada?.id || null);
  const [modalAdminsOpen, setModalAdminsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    sitioWeb: '',
    logoUrl: '',
    redesSociales: {
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
      youtube: '',
    },
  });

  useEffect(() => {
    if (organizacionSeleccionada) {
      setForm({
        nombre: organizacionSeleccionada.nombre || '',
        descripcion: organizacionSeleccionada.descripcion || '',
        sitioWeb: organizacionSeleccionada.sitioWeb || '',
        logoUrl: organizacionSeleccionada.logoUrl || '',
        redesSociales: {
          instagram: organizacionSeleccionada.redesSociales?.instagram || '',
          facebook: organizacionSeleccionada.redesSociales?.facebook || '',
          twitter: organizacionSeleccionada.redesSociales?.twitter || '',
          tiktok: organizacionSeleccionada.redesSociales?.tiktok || '',
          youtube: organizacionSeleccionada.redesSociales?.youtube || '',
        },
      });
    }
  }, [organizacionSeleccionada]);

  const handleSave = async () => {
    if (!organizacionSeleccionada) return;
    setSaving(true);
    try {
      await updateOrganizacion(organizacionSeleccionada.id, form);
      await recargarOrganizaciones();
      setEditMode(false);
      addToast({ type: 'success', title: 'Éxito', message: 'Organización actualizada correctamente' });
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar la organización' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (entityId: string, data: { email: string }) => {
    await addOrganizacionAdministrador(entityId, { email: data.email });
  };

  const handleRemoveAdmin = async (entityId: string, adminId: string) => {
    await removeOrganizacionAdministrador(entityId, adminId);
  };

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná una organización</h1>
        <p className="mt-2 text-sm text-slate-500">Necesitamos saber qué organización gestionás para mostrar su información.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        {organizacionSeleccionada.logoUrl && (
          <img
            src={organizacionSeleccionada.logoUrl}
            alt={organizacionSeleccionada.nombre}
            className="h-16 w-16 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-sm"
          />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">{organizacionSeleccionada.nombre}</h1>
          <p className="text-sm text-slate-500">Panel de organización</p>
          {!permissionsLoading && (
            <div className="flex flex-wrap gap-1 mt-1">
              {can.manageTeams && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  🏆 Equipos
                </span>
              )}
              {can.manageEvents && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  📅 Eventos
                </span>
              )}
              {can.manageMembers && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                  👥 Miembros
                </span>
              )}
              {can.manageFinances && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  💰 Finanzas
                </span>
              )}
              {can.viewPrivate && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  👁️ Privado
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Información general</h2>
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition"
              >
                ✏️ Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditMode(false);
                    setForm({
                      nombre: organizacionSeleccionada.nombre || '',
                      descripcion: organizacionSeleccionada.descripcion || '',
                      sitioWeb: organizacionSeleccionada.sitioWeb || '',
                      logoUrl: organizacionSeleccionada.logoUrl || '',
                      redesSociales: {
                        instagram: organizacionSeleccionada.redesSociales?.instagram || '',
                        facebook: organizacionSeleccionada.redesSociales?.facebook || '',
                        twitter: organizacionSeleccionada.redesSociales?.twitter || '',
                        tiktok: organizacionSeleccionada.redesSociales?.tiktok || '',
                        youtube: organizacionSeleccionada.redesSociales?.youtube || '',
                      },
                    });
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          {!editMode ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">ID</span>
                <span className="text-slate-900">{organizacionSeleccionada.id}</span>
              </p>
              <p className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</span>
                <span className="text-slate-900">{organizacionSeleccionada.nombre}</span>
              </p>
              {organizacionSeleccionada.descripcion && (
                <p className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Descripción</span>
                  <span className="text-slate-900">{organizacionSeleccionada.descripcion}</span>
                </p>
              )}
              {organizacionSeleccionada.sitioWeb && (
                <p className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Sitio Web</span>
                  <a 
                    href={organizacionSeleccionada.sitioWeb.startsWith('http') ? organizacionSeleccionada.sitioWeb : `https://${organizacionSeleccionada.sitioWeb}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {organizacionSeleccionada.sitioWeb}
                  </a>
                </p>
              )}
              {organizacionSeleccionada.redesSociales && Object.values(organizacionSeleccionada.redesSociales).some(Boolean) && (
                <p className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Redes sociales</span>
                  <span className="flex flex-wrap gap-3">
                    {([
                      ['instagram', 'Instagram'],
                      ['facebook', 'Facebook'],
                      ['twitter', 'X / Twitter'],
                      ['tiktok', 'TikTok'],
                      ['youtube', 'YouTube'],
                    ] as const).map(([key, label]) => {
                      const url = organizacionSeleccionada.redesSociales?.[key];
                      if (!url) return null;
                      return (
                        <a
                          key={key}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          {label}
                        </a>
                      );
                    })}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Nombre</label>
                <input 
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Descripción</label>
                <textarea 
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Sitio Web</label>
                <input 
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="https://ejemplo.com"
                  value={form.sitioWeb}
                  onChange={(e) => setForm({...form, sitioWeb: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">URL del Logo</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="URL de la imagen"
                  value={form.logoUrl}
                  onChange={(e) => setForm({...form, logoUrl: e.target.value})}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Subí la imagen a{' '}
                  <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="underline">
                    postimages.org
                  </a>{' '}
                  y pegá el link "Direct link". Usá una imagen cuadrada y de buena resolución para que se vea bien en las tarjetas compartibles.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 uppercase">Redes sociales</label>
                <div className="grid gap-2">
                  {([
                    ['instagram', 'Instagram', 'https://instagram.com/...'],
                    ['facebook', 'Facebook', 'https://facebook.com/...'],
                    ['twitter', 'X / Twitter', 'https://x.com/...'],
                    ['tiktok', 'TikTok', 'https://tiktok.com/@...'],
                    ['youtube', 'YouTube', 'https://youtube.com/...'],
                  ] as const).map(([key, label, placeholder]) => (
                    <input
                      key={key}
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      placeholder={`${label}: ${placeholder}`}
                      value={form.redesSociales[key]}
                      onChange={(e) => setForm({...form, redesSociales: {...form.redesSociales, [key]: e.target.value}})}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Administradores</h2>
            <button
              onClick={() => setModalAdminsOpen(true)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Administrar
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Gestioná los administradores de esta organización
          </p>
        </div>

        {can.manageMembers && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Miembros</h2>
              <span className="text-sm text-slate-500">
                {permissionsLoading ? 'Cargando...' : 'Gestión completa'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Gestioná los miembros y roles de esta organización
            </p>
          </div>
        )}
      </section>

      {/* Sección de gestión de miembros */}
      {can.manageMembers && (
        <section className="space-y-6">
          <GestionMiembros 
            organizacionId={organizacionSeleccionada.id} 
            canManageMembers={can.manageMembers} 
          />
        </section>
      )}

      <ModalGestionAdministradoresEntidad
        isOpen={modalAdminsOpen}
        onClose={() => setModalAdminsOpen(false)}
        entityId={organizacionSeleccionada.id}
        title="Administradores de la organización"
        addFunction={handleAddAdmin}
        getFunction={getOrganizacionAdministradores}
        removeFunction={handleRemoveAdmin}
      />
    </div>
  );
};

export default OrganizacionPage;
