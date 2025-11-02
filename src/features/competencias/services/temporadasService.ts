import { authFetch } from '../../../utils/authFetch';

export type BackendTemporada = {
  _id: string;
  competencia: string;
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

export async function listTemporadasByCompetencia(competenciaId: string): Promise<BackendTemporada[]> {
  const params = new URLSearchParams();
  params.set('competencia', competenciaId);
  return authFetch<BackendTemporada[]>(`/temporadas?${params.toString()}`);
}

export async function crearTemporada(payload: {
  competencia: string;
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}) {
  return authFetch<BackendTemporada>('/temporadas', { method: 'POST', body: payload });
}

export async function actualizarTemporada(id: string, body: Partial<BackendTemporada>) {
  return authFetch<BackendTemporada>(`/temporadas/${id}`, { method: 'PUT', body });
}

export async function eliminarTemporada(id: string) {
  return authFetch<{ mensaje: string }>(`/temporadas/${id}`, { method: 'DELETE' });
}

export async function getTemporadaById(id: string): Promise<BackendTemporada> {
  return authFetch<BackendTemporada>(`/temporadas/${id}`);
}
