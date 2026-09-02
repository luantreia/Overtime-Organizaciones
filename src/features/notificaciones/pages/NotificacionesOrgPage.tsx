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
        // Estadísticas cargadas por los equipos. La oficialización de una planilla
        // trae números al registro de la competencia, así que tiene que pasar por
        // acá; el lote agrupa por set lo que antes llegaba como una solicitud por
        // jugador.
        'estadisticasJugadorSet-lote',
        'planilla-equipo-oficializacion',
      ]}
      entityType="organizacion"
      scope="aprobables"
      canApprove={true}
      showCategoriaFilter={true}
      showEntidadFilter={false}
    />
  );
}
