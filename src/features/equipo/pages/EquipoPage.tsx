import { useEffect, useState } from 'react';
import EquipoCard from '../../../shared/components/EquipoCard/EquipoCard';
import { useOrganizacion } from '../../../app/providers/OrganizacionContext';
import { actualizarEquipo, getEquipo } from '../services/equipoService';
import type { Organizacion } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { Input, Textarea } from '../../../shared/components/ui';

const EquipoPage = () => {
  const { addToast } = useToast();
  const { organizacionSeleccionada, recargarOrganizaciones } = useOrganizacion();
  const [detalleOrganizacion, setDetalleOrganizacion] = useState<Organizacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    logoUrl: '',
  });

  useEffect(() => {
    const organizacionId = organizacionSeleccionada?.id;
    if (!organizacionId) {
      setDetalleOrganizacion(null);
      setFormData({ nombre: '', descripcion: '', logoUrl: '' });
      return;
    }

    let isCancelled = false;

    const fetchOrganizacion = async () => {
      try {
        setLoading(true);
        if (isCancelled) return;
        setDetalleOrganizacion(organizacionSeleccionada);
        setFormData({
          nombre: organizacionSeleccionada.nombre,
          descripcion: organizacionSeleccionada.descripcion ?? '',
          logoUrl: organizacionSeleccionada.logoUrl ?? '',
        });
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los datos de la organización.' });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrganizacion();

    return () => {
      isCancelled = true;
    };
  }, [organizacionSeleccionada?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organizacionSeleccionada) return;

    try {
      setSaving(true);
      // await actualizarOrganizacion(organizacionSeleccionada.id, formData);
      addToast({ type: 'success', title: 'Guardado', message: 'Datos de la organización actualizados' });
      await recargarOrganizaciones();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error al guardar', message: 'No pudimos guardar los cambios' });
    } finally {
      setSaving(false);
    }
  };

  if (!organizacionSeleccionada) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">No hay organización seleccionada</h1>
        <p className="mt-2 text-sm text-slate-500">
          Elegí una organización desde el selector superior para ver y editar la información.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Gestión de la organización</h1>
        <p className="mt-1 text-sm text-slate-500">
          Actualizá la información general de la organización.
        </p>
      </header>

      {detalleOrganizacion ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">{detalleOrganizacion.nombre}</h2>
          <p className="mt-1 text-sm text-slate-500">{detalleOrganizacion.descripcion}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Detalles de la organización</h2>
        <p className="mt-1 text-sm text-slate-500">
          Estos datos se muestran a tus administradores y usuarios.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            id="nombre"
            name="nombre"
            label="Nombre de la organización"
            type="text"
            required
            value={formData.nombre}
            onChange={handleChange as any}
            placeholder="Overtime Organizaciones"
          />

          <Textarea
            id="descripcion"
            name="descripcion"
            label="Descripción"
            rows={3}
            value={formData.descripcion}
            onChange={handleChange as any}
            placeholder="Resumen de la organización, logros o estilo de juego"
          />

          <Input
            id="logoUrl"
            name="logoUrl"
            label="URL del logo"
            type="url"
            value={formData.logoUrl}
            onChange={handleChange as any}
            placeholder="https://..."
          />

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      {loading ? <p className="text-sm text-slate-500">Actualizando información de la organización…</p> : null}
    </div>
  );
};

export default EquipoPage;
