import { authFetch } from '../../../utils/authFetch';

export type BackendParticipacionTemporada = {
  _id: string;
  temporada: string | { _id: string; nombre?: string };
  equipo: string | { _id: string; nombre?: string };
  estado?: string;
};

export async function listParticipacionesByTemporada(temporadaId: string): Promise<BackendParticipacionTemporada[]> {
  return authFetch<BackendParticipacionTemporada[]>(`/participacion-temporada?temporada=${encodeURIComponent(temporadaId)}`);
}

export async function crearParticipacionTemporadaDirect(payload: { temporada: string; equipo: string; estado?: string }) {
  return authFetch<BackendParticipacionTemporada>('/participacion-temporada', { method: 'POST', body: payload });
}

export async function crearSolicitudParticipacionTemporada(temporada: string, equipo: string) {
  return authFetch<{ _id: string }>(`/solicitudes-edicion`, {
    method: 'POST',
    body: {
      tipo: 'contratoEquipoCompetencia',
      entidad: null,
      datosPropuestos: { temporada, equipo },
    },
  });
}

export async function updateParticipacionTemporada(id: string, body: Partial<{ estado: string; observaciones?: string }>) {
  return authFetch<BackendParticipacionTemporada>(`/participacion-temporada/${id}`, { method: 'PUT', body });
}

export async function deleteParticipacionTemporada(id: string) {
  return authFetch<{ message?: string }>(`/participacion-temporada/${id}`, { method: 'DELETE' });
}
