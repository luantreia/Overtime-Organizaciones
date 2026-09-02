import { authFetch } from '../../../shared/utils/authFetch';

export type BackendJugadorTemporada = {
  _id: string;
  jugadorEquipo: string | { _id: string; jugador: { _id: string; nombre?: string; alias?: string }; equipo: string };
  jugador?: string;
  participacionTemporada: string;
  estado?: 'aceptado' | 'baja' | 'suspendido';
  rol?: 'jugador' | 'entrenador';
  numeroCamiseta?: number;
};

export async function listJugadorTemporadaByParticipacion(participacionTemporadaId: string): Promise<BackendJugadorTemporada[]> {
  const params = new URLSearchParams();
  params.set('participacionTemporada', participacionTemporadaId);
  return authFetch<BackendJugadorTemporada[]>(`/jugador-temporada?${params.toString()}`);
}

export async function createJugadorTemporada(payload: { jugadorEquipo: string; participacionTemporada: string; estado?: string; rol?: string; numeroCamiseta?: number }) {
  return authFetch<BackendJugadorTemporada>('/jugador-temporada', { method: 'POST', body: payload });
}

export async function updateJugadorTemporada(id: string, body: Partial<{ estado: string; rol: string; numeroCamiseta: number | null }>) {
  return authFetch<BackendJugadorTemporada>(`/jugador-temporada/${id}`, { method: 'PUT', body });
}

export type JugadorEquipoOpcion = {
  _id: string;
  jugador: {
    _id: string;
    nombre?: string;
    alias?: string;
    foto?: string;
    nacionalidad?: string;
    genero?: 'masculino' | 'femenino' | 'otro';
  };
  estado?: 'aceptado' | 'baja';
  hasta?: string;
  /** 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' — de la competencia de la temporada. */
  categoriaCompetencia?: string | null;
  /**
   * false solo cuando la competencia es Masculino o Femenino y el género del jugador
   * es el opuesto. Los jugadores con genero 'otro' —que es el default del schema— y
   * los que no lo tienen cargado siempre vienen elegibles.
   */
  elegible?: boolean;
  motivoNoElegible?: string | null;
};

export async function opcionesJugadorTemporada(equipoId: string, participacionTemporadaId: string, q?: string): Promise<JugadorEquipoOpcion[]> {
  const params = new URLSearchParams();
  params.set('equipo', equipoId);
  params.set('participacionTemporada', participacionTemporadaId);
  if (q) params.set('q', q);
  return authFetch<JugadorEquipoOpcion[]>(`/jugador-temporada/opciones?${params.toString()}`);
}
