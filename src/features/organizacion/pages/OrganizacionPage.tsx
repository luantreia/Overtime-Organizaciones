import { useState } from 'react';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import ModalGestionAdministradoresEntidad from '../../../shared/components/modalGestionAdministradoresEntidad/ModalGestionAdministradoresEntidad';
import { addOrganizacionAdministrador, getOrganizacionAdministradores, removeOrganizacionAdministrador } from '../services/organizacionService';

const OrganizacionPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();
  const [modalAdminsOpen, setModalAdminsOpen] = useState(false);

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
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Información general</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">ID</span>
              <span className="text-slate-900">{organizacionSeleccionada.id}</span>
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
          </div>
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
      </section>

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
