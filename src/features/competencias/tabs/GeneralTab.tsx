import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  actualizarCompetencia,
  addCompetenciaAdministrador,
  eliminarCompetencia,
  getCompetenciaAdministradores,
  removeCompetenciaAdministrador,
} from '../services';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import GeneralSection from '../sections/GeneralSection';
import ConfirmEliminarCompetenciaModal from '../modals/ConfirmEliminarCompetenciaModal';
import type { CompetenciaDetalle, DatosCompetencia } from '../hooks/useCompetenciaDetalle';

type Props = {
  competenciaId: string;
  detalle: CompetenciaDetalle;
};

/**
 * Pestaña General. Dueña del borrador del formulario: lo que el usuario tipea vive acá hasta que
 * guarda, y recién ahí se recarga el detalle compartido (por eso activar "Ranked" muestra la
 * pestaña Ranked al guardar, no al tildar).
 */
export default function GeneralTab({ competenciaId, detalle }: Props) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { datos, admins, setAdmins, esAdmin, recargar } = detalle;

  const [borrador, setBorrador] = useState<DatosCompetencia>(datos);
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  // Si el detalle se recarga (al guardar, o porque llegó tarde), el borrador lo sigue.
  useEffect(() => setBorrador(datos), [datos]);

  const campo = <K extends keyof DatosCompetencia>(k: K) => (v: DatosCompetencia[K]) =>
    setBorrador((prev) => ({ ...prev, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await actualizarCompetencia(competenciaId, {
        nombre: borrador.nombre,
        modalidad: borrador.modalidad || undefined,
        categoria: borrador.categoria || undefined,
        tipo: borrador.tipo || undefined,
        fechaInicio: borrador.fechaInicio || undefined,
        fechaFin: borrador.fechaFin || undefined,
        descripcion: borrador.descripcion,
        rankedEnabled: borrador.rankedEnabled,
        duracionTiempoMinutos: Number(borrador.duracionTiempoMinutos) > 0 ? Number(borrador.duracionTiempoMinutos) : null,
      });
      addToast({ type: 'success', title: 'Competencia actualizada' });
      await recargar();
    } finally {
      setSaving(false);
    }
  };

  const refrescarAdmins = async () => {
    const { administradores } = await getCompetenciaAdministradores(competenciaId);
    setAdmins(administradores || []);
  };

  const agregarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    await addCompetenciaAdministrador(competenciaId, { email: adminEmail.trim() });
    setAdminEmail('');
    await refrescarAdmins();
  };

  const quitarAdmin = async (adminId: string) => {
    await removeCompetenciaAdministrador(competenciaId, adminId);
    await refrescarAdmins();
  };

  return (
    <>
      <GeneralSection
        nombre={borrador.nombre}
        setNombre={campo('nombre')}
        modalidad={borrador.modalidad}
        setModalidad={campo('modalidad')}
        categoria={borrador.categoria}
        setCategoria={campo('categoria')}
        tipo={borrador.tipo}
        setTipo={campo('tipo')}
        fechaInicio={borrador.fechaInicio}
        setFechaInicio={campo('fechaInicio')}
        fechaFin={borrador.fechaFin}
        setFechaFin={campo('fechaFin')}
        descripcion={borrador.descripcion}
        setDescripcion={campo('descripcion')}
        rankedEnabled={borrador.rankedEnabled}
        setRankedEnabled={campo('rankedEnabled')}
        duracionTiempoMinutos={borrador.duracionTiempoMinutos}
        setDuracionTiempoMinutos={campo('duracionTiempoMinutos')}
        esAdmin={esAdmin}
        saving={saving}
        onSubmit={guardar}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        admins={admins}
        onAgregarAdmin={agregarAdmin}
        onQuitarAdmin={quitarAdmin}
        onEliminarCompetenciaRequested={() => setConfirmEliminar(true)}
      />

      {confirmEliminar ? (
        <ConfirmEliminarCompetenciaModal
          isOpen
          onConfirm={async () => {
            await eliminarCompetencia(competenciaId);
            addToast({ type: 'success', title: 'Competencia eliminada' });
            navigate('/competencias');
          }}
          onCancel={() => setConfirmEliminar(false)}
        />
      ) : null}
    </>
  );
}
