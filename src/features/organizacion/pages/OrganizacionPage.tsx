import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import OrganizacionAdmins from '../components/OrganizacionAdmins';

const OrganizacionPage = () => {
  const { organizacionSeleccionada } = useOrganizacion();

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
          <h2 className="text-lg font-semibold text-slate-900">Accesos rápidos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <a href="/competencias" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50">Competencias</a>
            <a href="/partidos" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50">Partidos</a>
            <a href="/estadisticas" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50">Estadísticas</a>
            <a href="/notificaciones" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50">Notificaciones</a>
          </div>
        </div>
      </section>

      <OrganizacionAdmins />
    </div>
  );
};

export default OrganizacionPage;
