// Tipos para solicitudes de edición (copiado del canonical manager)

export type SolicitudEdicionEstado = 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado';

export type SolicitudEdicionTipo = 
  //pagina partido en esta ap solo deberia poder editar los resultados y no solicitar a nadie, porque es gestion organizaciones y si son partidos dela organiazcion deberia poder gestionarlos sin solicitudes
  | 'resultadoPartido'
  | 'resultadoSet' 

  // (jugadores/contratos excluded in this app)

  //pagina competencias 
  | 'participacion-temporada-crear'
  | 'participacion-temporada-actualizar'
  | 'participacion-temporada-eliminar'
  //pagina competencias/temporada
  | 'jugador-temporada-crear'
  | 'jugador-temporada-actualizar'
  | 'jugador-temporada-eliminar'

  //pagina usuario
  | 'usuario-crear-jugador'
  | 'usuario-crear-equipo'
  | 'usuario-crear-organizacion'
  | 'usuario-solicitar-admin-jugador'
  | 'usuario-solicitar-admin-equipo'
  | 'usuario-solicitar-admin-organizacion';

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
