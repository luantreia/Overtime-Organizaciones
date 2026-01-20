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
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{organizacionSeleccionada.nombre}</h1>
        <p className="text-sm text-slate-500">Panel de organización</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Información general</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="text-slate-500">ID:</span> {organizacionSeleccionada.id}</p>
            {organizacionSeleccionada.descripcion ? (
              <p><span className="text-slate-500">Descripción:</span> {organizacionSeleccionada.descripcion}</p>
            ) : null}
            {organizacionSeleccionada.responsables?.length ? (
              <p><span className="text-slate-500">Responsables:</span> {organizacionSeleccionada.responsables.join(', ')}</p>
            ) : null}
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
