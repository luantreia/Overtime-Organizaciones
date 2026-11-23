import type { SolicitudEdicionEstado, SolicitudEdicionTipo } from '../../types/modelos.generado';
// Enums derivados del schema de Mongoose (npm run tipos en overtime/). No redeclarar a mano.
export type { SolicitudEdicionEstado, SolicitudEdicionTipo };
// Tipos para solicitudes de edición (copiado del canonical manager)




export interface ISolicitudEdicion {
  _id: string;
  tipo: SolicitudEdicionTipo;
  entidad?: string | null;
  datosPropuestos: Record<string, unknown>;
  estado: SolicitudEdicionEstado;
  aceptadoPor: string[];
  requiereDobleConfirmacion?: boolean;
  motivoRechazo?: string;
  fechaAceptacion?: string;
  fechaRechazo?: string;
  creadoPor: string;
  aprobadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export type SolicitudEdicion = ISolicitudEdicion & { id: string };

export interface ISolicitudCrearPayload {
  tipo: SolicitudEdicionTipo;
  entidad?: string;
  datosPropuestos: Record<string, unknown>;
}

export interface ISolicitudActualizarPayload {
  estado: 'aceptado' | 'rechazado';
  motivoRechazo?: string;
  datosPropuestos?: Record<string, unknown>;
}

export interface ISolicitudFiltros {
  tipo?: SolicitudEdicionTipo;
  estado?: SolicitudEdicionEstado;
  creadoPor?: string;
  entidad?: string;
  page?: number;
  limit?: number;
}
