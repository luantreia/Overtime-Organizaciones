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

export type EquipoCompetenciaVinculo = {
  _id: string;
  equipo: { _id: string; nombre?: string } | string;
  estado?: string;
};

export async function getEquiposAceptadosPorCompetencia(competenciaId: string): Promise<EquipoCompetenciaVinculo[]> {
  const params = new URLSearchParams();
  params.set('competencia', competenciaId);
  params.set('estado', 'aceptado');
  const todos = await authFetch<EquipoCompetenciaVinculo[]>(`/equipos-competencia?${params.toString()}`);
  return todos.filter(ec => !ec.estado || ec.estado === 'aceptado');
}
