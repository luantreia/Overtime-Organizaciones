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
  equipo: { _id: string; nombre?: string; escudo?: string } | string;
  competencia?: { _id: string; nombre?: string } | string;
  estado?: string;
};

export async function getEquiposAceptadosPorCompetencia(competenciaId: string): Promise<EquipoCompetenciaVinculo[]> {
  const params = new URLSearchParams();
  params.set('competencia', competenciaId);
  params.set('estado', 'aceptado');
  const todos = await authFetch<EquipoCompetenciaVinculo[]>(`/equipos-competencia?${params.toString()}`);
  return todos.filter(ec => !ec.estado || ec.estado === 'aceptado');
}

export async function getEquiposDeOrganizacion(
  organizacionId: string,
  excludeCompetenciaId?: string,
): Promise<EquipoCompetenciaVinculo[]> {
  const params = new URLSearchParams();
  params.set('organizacion', organizacionId);
  params.set('estado', 'aceptado');
  const todos = await authFetch<EquipoCompetenciaVinculo[]>(`/equipos-competencia?${params.toString()}`);
  const aceptados = todos.filter(ec => !ec.estado || ec.estado === 'aceptado');
  if (!excludeCompetenciaId) return aceptados;
  // Dedup: un equipo puede aparecer en múltiples competencias; deduplicar por equipo._id
  const seen = new Set<string>();
  return aceptados.filter(ec => {
    const compId = typeof ec.competencia === 'string' ? ec.competencia : (ec.competencia as any)?._id;
    if (compId === excludeCompetenciaId) return false;
    const eqId = typeof ec.equipo === 'string' ? ec.equipo : (ec.equipo as any)?._id;
    if (!eqId || seen.has(eqId)) return false;
    seen.add(eqId);
    return true;
  });
}
