import { authFetch } from '../../../shared/utils/authFetch';

export type BackendParticipacionFase = {
  _id: string;
  fase: string;
  participacionTemporada: string | { _id: string; equipo?: string | { _id: string; nombre?: string } };
  grupo?: string;
  division?: string;
};

export async function listParticipacionesByFase(faseId: string): Promise<BackendParticipacionFase[]> {
  const params = new URLSearchParams();
  params.set('fase', faseId);
  return authFetch<BackendParticipacionFase[]>(`/participacion-fase?${params.toString()}`);
}

export async function crearParticipacionFase(payload: { participacionTemporada: string; fase: string; grupo?: string; division?: string }) {
  return authFetch<BackendParticipacionFase>('/participacion-fase', { method: 'POST', body: payload });
}

export async function updateParticipacionFase(id: string, body: Partial<{ grupo: string; division: string; seed: number; posicion: number }>) {
  return authFetch<BackendParticipacionFase>(`/participacion-fase/${id}`, { method: 'PUT', body });
}

export async function deleteParticipacionFase(id: string) {
  return authFetch<{ mensaje?: string }>(`/participacion-fase/${id}`, { method: 'DELETE' });
}
