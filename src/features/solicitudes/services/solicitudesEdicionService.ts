import { authFetch } from '../../../utils/authFetch';
import type { SolicitudEdicion, SolicitudEdicionEstado, SolicitudEdicionTipo } from '../../../types/solicitudesEdicion';

export type GetSolicitudesParams = {
  tipo?: SolicitudEdicionTipo;
  estado?: SolicitudEdicionEstado;
  creadoPor?: string;
  entidad?: string;
};

const toQuery = (params: GetSolicitudesParams = {}) => {
  const qs = new URLSearchParams();
  if (params.tipo) qs.set('tipo', params.tipo);
  if (params.estado) qs.set('estado', params.estado);
  if (params.creadoPor) qs.set('creadoPor', params.creadoPor);
  if (params.entidad) qs.set('entidad', params.entidad);
  return qs.toString();
};

export const getSolicitudes = async (params: GetSolicitudesParams = {}) => {
  const q = toQuery(params);
  const url = `/solicitudes-edicion${q ? `?${q}` : ''}`;
  return authFetch<SolicitudEdicion[]>(url);
};

export const actualizarSolicitud = async (
  id: string,
  payload: { estado?: 'aceptado' | 'rechazado'; motivoRechazo?: string; datosPropuestos?: Record<string, any> }
) => {
  return authFetch<SolicitudEdicion>(`/solicitudes-edicion/${id}`, { method: 'PUT', body: payload });
};

export const cancelarSolicitud = async (id: string) => {
  return authFetch<{ message: string }>(`/solicitudes-edicion/${id}`, { method: 'DELETE' });
};

export const crearSolicitud = async (
  tipo: SolicitudEdicionTipo,
  datosPropuestos: Record<string, any>,
  entidad?: string | null
) => {
  return authFetch<{ _id: string }>(`/solicitudes-edicion`, {
    method: 'POST',
    body: {
      tipo,
      entidad: entidad || null,
      datosPropuestos,
    },
  });
};
