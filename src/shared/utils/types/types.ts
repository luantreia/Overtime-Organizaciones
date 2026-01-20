// =====================================================================================
// TYPES CONSOLIDADOS - overtime-gestion-organizaciones
// Ubicación: shared/utils/types/types.ts
// =====================================================================================

// ========================================
// TIPOS GENERALES DE USUARIO Y ENTIDADES
// ========================================

export type RolUsuario = 'manager' | 'adminEquipo' | 'jugador' | 'lector' | 'editor' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface AdminUser {
  _id: string;
  nombre?: string;
  email?: string;
}

// ========================================
// TIPOS DE EQUIPOS Y ORGANIZACIONES
// ========================================

export interface Equipo {
  id: string;
  nombre: string;
  logoUrl?: string;
  staff?: string[];
  descripcion?: string;
}

export interface Organizacion {
  id: string;
  nombre: string;
  logoUrl?: string;
  descripcion?: string;
  sitioWeb?: string;
}

// ========================================
// TIPOS DE JUGADORES
// ========================================

export type EstadoJugador = 'activo' | 'pendiente' | 'baja';

export interface Jugador {
  id: string;
  nombre: string;
  posicion: string;
  estado: EstadoJugador;
  numeroCamiseta?: number;
  rolEnEquipo?: string;
  rol?: string;
  fechaInicio?: string;
  fechaFin?: string | null;
  contratoId?: string;
  creadoPor?: string;
  administradores?: string[];
  alias?: string;
  fechaNacimiento?: string;
  genero?: string;
  foto?: string;
  nacionalidad?: string;
}

// ========================================
// TIPOS DE SOLICITUDES DE JUGADORES
// ========================================

export interface SolicitudJugador {
  id: string;
  jugador: Jugador;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  mensaje?: string;
  origen?: 'equipo' | 'jugador';
  fechaSolicitud?: string;
  solicitadoPor?: string;
  equipo?: { id: string; nombre?: string; creadoPor?: string; administradores?: string[] };
  fechaInicio?: string;
  fechaFin?: string | null;
}

export interface ContratoJugadorResumen {
  id: string;
  jugadorNombre: string;
  estado: string;
  rol?: string;
  origen?: 'equipo' | 'jugador';
  fechaInicio?: string;
  fechaFin?: string | null;
  fechaSolicitud?: string;
  fechaAceptacion?: string;
}

// ========================================
// TIPOS DE COMPETENCIAS Y TEMPORADAS
// ========================================

export interface Competencia {
  id: string;
  nombre: string;
  estado: 'activa' | 'finalizada' | 'inscripcion';
  faseActual?: string;
  posicionActual?: number;
}

export interface TemporadaJugador {
  id: string;
  nombre?: string;
  competencia: {
    id?: string;
    nombre?: string;
    modalidad?: string;
    categoria?: string;
  };
  equipo: {
    id?: string;
    nombre?: string;
  };
  fechaInicio?: string;
  fechaFin?: string | null;
  estado?: 'activo' | 'baja' | string;
  rol?: string;
  descripcion?: string;
}

export interface EquipoCompetencia {
  id: string;
  equipo: Equipo;
  competencia: Competencia;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fixtureUrl?: string;
}

// ========================================
// TIPOS DE PARTIDOS
// ========================================

export type EstadoPartido = 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'proximamente';

export interface SetPartido {
  _id: string;
  numeroSet: number;
  estadoSet: string;
  ganadorSet: string;
  marcadorLocal?: number;
  marcadorVisitante?: number;
}

export interface Partido {
  id: string;
  fecha: string;
  hora?: string;
  rival: string;
  estado: EstadoPartido;
  escenario?: string;
  competencia?: Competencia;
  etapa?: 'octavos' | 'cuartos' | 'semifinal' | 'final' | 'tercer_puesto' | 'repechaje' | 'otro' | string;
  localNombre?: string;
  visitanteNombre?: string;
  grupo?: string | null;
  division?: string | null;
  resultado?: {
    puntosEquipo: number;
    puntosRival: number;
  };
  equipoLocal?: {
    id: string;
    nombre: string;
    escudo?: string;
  };
  equipoVisitante?: {
    id: string;
    nombre: string;
    escudo?: string;
  };
  marcadorLocal?: number;
  marcadorVisitante?: number;
  sets?: SetPartido[];
}

export interface JugadorPartido {
  id: string;
  partidoId: string;
  jugador: Jugador;
  rol: 'jugador' | 'entrenador';
  confirmoAsistencia?: boolean;
  notas?: string;
  equipo?: string | { _id?: string };
  numero?: number;
}

export interface SolicitudCompetencia {
  id: string;
  competencia: Competencia;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
}

// ========================================
// TIPOS DE ESTADÍSTICAS
// ========================================

export interface EstadisticaJugador {
  jugador: Jugador;
  partidosJugados: number;
  puntosPromedio: number;
  bloqueosPromedio: number;
  efectividad: number;
  faltasPromedio: number;
}

export interface EstadisticaEquipoResumen {
  racha: Array<'W' | 'D' | 'L'>;
  efectividadEquipo: number;
  puntosPorPartido: number;
  posicionActual?: number;
}

export interface DashboardResumen {
  proximosPartidos: Partido[];
  jugadoresActivos: number;
  solicitudesPendientes: number;
  resumenEquipo?: EstadisticaEquipoResumen;
}

export interface Notificacion {
  id: string;
  tipo: 'jugador' | 'competencia' | 'partido' | 'sistema';
  titulo: string;
  descripcion: string;
  fecha: string;
  leida: boolean;
  relacionadoId?: string;
}