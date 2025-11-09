import { authFetch } from '../../../utils/authFetch';

export type BackendJugadorTemporada = {
  _id: string;
  jugadorEquipo: string;
  jugador?: string;
  participacionTemporada: string;
  estado?: 'aceptado' | 'baja' | 'suspendido';
  rol?: 'jugador' | 'entrenador';
};

export async function listJugadorTemporadaByParticipacion(participacionTemporadaId: string): Promise<BackendJugadorTemporada[]> {
  const params = new URLSearchParams();
  params.set('participacionTemporada', participacionTemporadaId);
  return authFetch<BackendJugadorTemporada[]>(`/jugador-temporada?${params.toString()}`);
}

export async function createJugadorTemporada(payload: { jugadorEquipo: string; participacionTemporada: string; estado?: string; rol?: string }) {
  return authFetch<BackendJugadorTemporada>('/jugador-temporada', { method: 'POST', body: payload });
}

export async function updateJugadorTemporada(id: string, body: Partial<{ estado: string; rol: string }>) {
  return authFetch<BackendJugadorTemporada>(`/jugador-temporada/${id}`, { method: 'PUT', body });
}

export async function deleteJugadorTemporada(id: string) {
  return authFetch<{ mensaje?: string }>(`/jugador-temporada/${id}`, { method: 'DELETE' });
}

export type JugadorEquipoOpcion = { _id: string; jugador: { _id: string; nombre?: string; alias?: string; foto?: string; nacionalidad?: string } };

export async function opcionesJugadorTemporada(equipoId: string, participacionTemporadaId: string, q?: string): Promise<JugadorEquipoOpcion[]> {
  const params = new URLSearchParams();
  params.set('equipo', equipoId);
  params.set('participacionTemporada', participacionTemporadaId);
  if (q) params.set('q', q);
  return authFetch<JugadorEquipoOpcion[]>(`/jugador-temporada/opciones?${params.toString()}`);
}
