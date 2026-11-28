import { authFetch } from '../../../shared/utils/authFetch';
import type { Video as VideoModelo } from '../../../shared/types/modelos.generado';

/** Video del catálogo de una competencia, como lo devuelve /videos (partido poblado). */
export interface VideoCompetencia extends Omit<VideoModelo, 'partido' | 'competencia' | 'organizacion'> {
  partido: {
    _id: string;
    fecha?: string;
    nombrePartido?: string;
    equipoLocal?: { _id: string; nombre: string };
    equipoVisitante?: { _id: string; nombre: string };
  } | null;
  competencia: { _id: string; nombre: string } | null;
}

export const getVideosCompetencia = (competenciaId: string) =>
  authFetch<VideoCompetencia[]>(`/videos?competencia=${competenciaId}&limite=500`);

export const cargarVideo = (body: { url: string; titulo?: string; etiqueta?: string; competencia: string; partido?: string | null }) =>
  authFetch<VideoCompetencia>('/videos', { method: 'POST', body });

export const editarVideo = (
  id: string,
  body: { titulo?: string; etiqueta?: string; enTv?: boolean; partido?: string | null; principal?: boolean },
) => authFetch<VideoCompetencia>(`/videos/${id}`, { method: 'PATCH', body });

export const borrarVideo = (id: string) => authFetch<void>(`/videos/${id}`, { method: 'DELETE' });
