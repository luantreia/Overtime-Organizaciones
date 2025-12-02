import { authFetch } from '../../../shared/utils/authFetch';

export type BackendJugadorCompetencia = {
  _id: string;
  jugador: { _id: string; nombre?: string; apellido?: string; foto?: string } | string;
  competencia: string;
  posicion?: string;
  dorsal?: number;
  titular?: boolean;
  activo?: boolean;
};

export async function listJugadoresCompetencia(competenciaId: string): Promise<BackendJugadorCompetencia[]> {
  return authFetch<BackendJugadorCompetencia[]>(`/jugador-competencia?competencia=${encodeURIComponent(competenciaId)}`);
}

export async function crearJugadorCompetencia(payload: { jugador: string; competencia: string; posicion?: string; dorsal?: number; titular?: boolean }) {
  return authFetch<BackendJugadorCompetencia>(`/jugador-competencia`, { method: 'POST', body: payload });
}

export async function eliminarJugadorCompetencia(id: string) {
  return authFetch<{ mensaje?: string }>(`/jugador-competencia/${id}`, { method: 'DELETE' });
}
