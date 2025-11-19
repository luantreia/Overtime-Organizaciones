import { authFetch } from '../../../utils/authFetch';
import { crearSolicitud } from '../../solicitudes/services/solicitudesEdicionService';

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
  return crearSolicitud('participacion-temporada-crear', {
    temporadaId: temporada,
    equipoId: equipo
  });
}

export async function updateParticipacionTemporada(id: string, body: Partial<{ estado: string; observaciones?: string }>) {
  return authFetch<BackendParticipacionTemporada>(`/participacion-temporada/${id}`, { method: 'PUT', body });
}

export async function deleteParticipacionTemporada(id: string) {
  return authFetch<{ message?: string }>(`/participacion-temporada/${id}`, { method: 'DELETE' });
}

export type EquipoDisponibleOpcion = { _id: string; nombre: string; escudo?: string; tipo?: string; pais?: string };

export async function opcionesEquiposParaTemporada(temporadaId: string, q?: string, soloMisEquipos?: boolean): Promise<EquipoDisponibleOpcion[]> {
  const params = new URLSearchParams();
  params.set('temporada', temporadaId);
  if (q) params.set('q', q);
  if (soloMisEquipos) params.set('soloMisEquipos', 'true');
  return authFetch<EquipoDisponibleOpcion[]>(`/participacion-temporada/opciones?${params.toString()}`);
}
