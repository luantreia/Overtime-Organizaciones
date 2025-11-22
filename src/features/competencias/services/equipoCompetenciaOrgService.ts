import { authFetch } from '../../../shared/utils/authFetch';

export type SolicitudEquipoCompetencia = {
  _id: string;
  equipo?: { _id: string; nombre?: string } | string;
  competencia?: { _id: string; nombre?: string } | string;
  estado?: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'finalizado' | string;
  creadoPor?: string;
  solicitadoPor?: string;
  origen?: 'equipo' | 'competencia';
  fechaAceptacion?: string;
  desde?: string;
  hasta?: string;
  motivoRechazo?: string;
};

export async function getSolicitudesPorCompetencia(competenciaId: string, estado: string = 'pendiente') {
  const params = new URLSearchParams();
  params.set('competencia', competenciaId);
  if (estado) params.set('estado', estado);
  return authFetch<SolicitudEquipoCompetencia[]>(`/equipos-competencia/solicitudes?${params.toString()}`);
}
