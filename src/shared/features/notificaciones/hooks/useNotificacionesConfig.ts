import type { SolicitudEdicionTipo } from '../types/notificacionesTypes';
import type { UseNotificacionesConfigResult } from '../types/notificacionesTypes';

const TIPO_CATEGORIAS: Record<string, string> = {
  // Usuario y solicitud de admin
  'usuario-crear-jugador': 'Mi Cuenta',
  'usuario-crear-equipo': 'Mi Cuenta',
  'usuario-crear-organizacion': 'Mi Cuenta',
  'usuario-solicitar-admin-jugador': 'Mi Cuenta',
  'usuario-solicitar-admin-equipo': 'Mi Cuenta',
  'usuario-solicitar-admin-organizacion': 'Mi Cuenta',
  
  // Participaciones
  'participacion-temporada-crear': 'Participaciones',
  'participacion-temporada-actualizar': 'Participaciones',
  'participacion-temporada-eliminar': 'Participaciones',
  
  // Jugador Temporada
  'jugador-temporada-crear': 'Jugadores',
  'jugador-temporada-actualizar': 'Jugadores',
  'jugador-temporada-eliminar': 'Jugadores',
};

const TIPO_LABELS: Record<string, string> = {
  // Usuario y solicitud de admin
  'usuario-crear-jugador': 'Crear Jugador',
  'usuario-crear-equipo': 'Crear Equipo',
  'usuario-crear-organizacion': 'Crear Organización',
  'usuario-solicitar-admin-jugador': 'Solicitar Admin Jugador',
  'usuario-solicitar-admin-equipo': 'Solicitar Admin Equipo',
  'usuario-solicitar-admin-organizacion': 'Solicitar Admin Organización',
  
  // Participaciones
  'participacion-temporada-crear': 'Nueva Participación',
  'participacion-temporada-actualizar': 'Actualizar Participación',
  'participacion-temporada-eliminar': 'Eliminar Participación',
  
  // Jugador Temporada
  'jugador-temporada-crear': 'Nuevo Jugador en Temporada',
  'jugador-temporada-actualizar': 'Actualizar Jugador en Temporada',
  'jugador-temporada-eliminar': 'Eliminar Jugador de Temporada',
};

/**
 * Hook de configuración para NotificacionesPanel en Overtime-Organizaciones
 * Tipos: usuario-crear, participaciones-temporada-crear/actualizar/eliminar, jugador-temporada-crear/actualizar/eliminar
 */
export const useNotificacionesConfig = (): UseNotificacionesConfigResult => {
  const allowedTipos: readonly SolicitudEdicionTipo[] = [
    'usuario-crear-jugador',
    'usuario-crear-equipo',
    'usuario-crear-organizacion',
    'usuario-solicitar-admin-jugador',
    'usuario-solicitar-admin-equipo',
    'usuario-solicitar-admin-organizacion',
    'participacion-temporada-crear',
    'participacion-temporada-actualizar',
    'participacion-temporada-eliminar',
    'jugador-temporada-crear',
    'jugador-temporada-actualizar',
    'jugador-temporada-eliminar',
  ];

  const categoriaDeTipo = (tipo: SolicitudEdicionTipo): string => {
    return TIPO_CATEGORIAS[tipo] || 'Otros';
  };

  const labelTipo = (tipo: SolicitudEdicionTipo): string => {
    return TIPO_LABELS[tipo] || tipo;
  };

  const categoriasDisponibles = ['Mi Cuenta', 'Participaciones', 'Jugadores', 'Otros'];

  return {
    allowedTipos,
    categoriaDeTipo,
    labelTipo,
    categoriasDisponibles,
    canApprove: true,
  };
};
