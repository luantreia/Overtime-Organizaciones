import { authFetch } from '../../../shared/utils/authFetch';

export type BackendJugadorFase = {
  _id: string;
  jugadorTemporada: string | { _id: string; jugadorEquipo?: { jugador?: { _id: string; nombre?: string; alias?: string } } };
  participacionFase: string;
  estado?: 'activo' | 'inactivo' | 'lesionado' | 'suspendido';
  rol?: string;
};

export type OpcionJugadorFase = {
  _id: string; // jugadorTemporada id
  jugador: { _id: string; nombre?: string; alias?: string; foto?: string; nacionalidad?: string } | null;
  rol?: string;
};

export async function listByParticipacionFase(participacionFaseId: string): Promise<BackendJugadorFase[]> {
  const params = new URLSearchParams();
  params.set('participacionFase', participacionFaseId);
  return authFetch<BackendJugadorFase[]>(`/jugador-fase?${params.toString()}`);
}

export async function opcionesJugadorFase(
  participacionTemporadaId: string,
  participacionFaseId?: string,
  q?: string
): Promise<OpcionJugadorFase[]> {
  const params = new URLSearchParams();
  params.set('participacionTemporada', participacionTemporadaId);
  if (participacionFaseId) params.set('participacionFase', participacionFaseId);
  if (q) params.set('q', q);
  return authFetch<OpcionJugadorFase[]>(`/jugador-fase/opciones?${params.toString()}`);
}

export async function crearJugadorFase(payload: { jugadorTemporada: string; participacionFase: string; estado?: string }) {
  return authFetch<BackendJugadorFase>('/jugador-fase', { method: 'POST', body: { estado: 'activo', ...payload } });
}

export async function eliminarJugadorFase(id: string) {
  return authFetch<{ mensaje?: string }>(`/jugador-fase/${id}`, { method: 'DELETE' });
}
