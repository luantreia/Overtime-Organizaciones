import React from 'react';
import { NotificacionesPanel } from '../../../shared/features/notificaciones/components/NotificacionesPanel';

export default function NotificacionesOrgPage() {
  return (
    <NotificacionesPanel
      title="Notificaciones"
      description="Gestiona las solicitudes de edición de organizaciones"
      allowedTipos={[
        'usuario-crear-jugador',
        'usuario-crear-equipo',
        'usuario-crear-organizacion',
        'participacion-temporada-crear',
        'participacion-temporada-actualizar',
        'participacion-temporada-eliminar',
        'jugador-temporada-crear',
        'jugador-temporada-actualizar',
        'jugador-temporada-eliminar',
      ]}
      entityType="organizacion"
      scope="aprobables"
      canApprove={true}
      showCategoriaFilter={true}
      showEntidadFilter={false}
    />
  );
}
