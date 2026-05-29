import React, { useState, useMemo, useCallback } from 'react';
import type { ISolicitudEdicion } from '../../solicitudes/types/solicitudesEdicion';
import type { NotificacionesPanelProps, NotificacionFilterState } from '../types/notificacionesTypes';
import { useNotificacionesConfig } from '../hooks/useNotificacionesConfig';
import { useNotificacionesData } from '../hooks/useNotificacionesData';
import { NotificacionesFilters } from './NotificacionesFilters';
import { NotificacionesTable } from './NotificacionesTable';

export const NotificacionesPanel: React.FC<NotificacionesPanelProps> = ({
  title,
  description,
  allowedTipos,
  entityType,
  scope = 'aprobables',
  canApprove,
  showCategoriaFilter = true,
  showEntidadFilter = false,
}) => {
  const [filters, setFilters] = useState<NotificacionFilterState>({
    estado: 'pendiente',
    categoria: '',
    entidad: '',
    query: '',
    soloMisSolicitudes: false,
    autoRefresh: true,
  });

  const { categoriaDeTipo, labelTipo, categoriasDisponibles } = useNotificacionesConfig();

  const { loading, error, solicitudes, aprobar, rechazar, refresh } = useNotificacionesData({
    scope,
    allowedTipos,
    entityType,
  });

  const handleViewDetails = useCallback((solicitud: ISolicitudEdicion) => {
    // For now, just log - the modal view could be added later
    console.log('View details:', solicitud._id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>

      <NotificacionesFilters
        filters={filters}
        onFiltersChange={setFilters}
        categoriasDisponibles={categoriasDisponibles}
        showCategoriaFilter={showCategoriaFilter}
        showEntidadFilter={showEntidadFilter}
        onRefresh={refresh}
        loading={loading}
      />

      <NotificacionesTable
        solicitudes={solicitudes}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        categoriasDisponibles={categoriasDisponibles}
        categoriaDeTipo={categoriaDeTipo}
        labelTipo={labelTipo}
        canApprove={canApprove}
        showCategoriaFilter={showCategoriaFilter}
        showEntidadFilter={showEntidadFilter}
        onRefresh={refresh}
        onAprobar={aprobar}
        onRechazar={rechazar}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};
