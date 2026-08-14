import { authFetch } from '../../../shared/utils/authFetch';

export type RolPlanillero = 'planillero' | 'arbitro' | 'mesa' | 'veedor';

export type BackendAsignacionPartido = {
  _id: string;
  usuarioId: string | { _id: string; nombre?: string; email?: string };
  partido?: string;
  fase?: string;
  rol: RolPlanillero;
  permisos: string[];
  estado: 'activa' | 'revocada';
  desde?: string;
  hasta?: string;
  notas?: string;
};

export type CrearAsignacionPayload = {
  email?: string;
  usuarioId?: string;
  partido?: string;
  fase?: string;
  rol: RolPlanillero;
  desde?: string;
  hasta?: string;
  notas?: string;
};

export const ROLES_PLANILLERO: Array<{ value: RolPlanillero; label: string; ayuda: string }> = [
  { value: 'planillero', label: 'Planillero', ayuda: 'Carga jugadores, sets y resultado' },
  { value: 'arbitro', label: 'Árbitro', ayuda: 'Carga sets y resultado' },
  { value: 'mesa', label: 'Mesa', ayuda: 'Carga sets y estadísticas' },
  { value: 'veedor', label: 'Veedor', ayuda: 'Solo observa, no carga nada' },
];

export async function listAsignacionesPorPartido(partidoId: string) {
  return authFetch<BackendAsignacionPartido[]>(`/asignaciones-partido?partido=${partidoId}`);
}

export async function listAsignacionesPorFase(faseId: string) {
  return authFetch<BackendAsignacionPartido[]>(`/asignaciones-partido?fase=${faseId}`);
}

export async function crearAsignacion(payload: CrearAsignacionPayload) {
  return authFetch<BackendAsignacionPartido>('/asignaciones-partido', {
    method: 'POST',
    body: { ...payload },
  });
}

export async function revocarAsignacion(id: string) {
  return authFetch<{ mensaje: string }>(`/asignaciones-partido/${id}`, { method: 'DELETE' });
}

/** Fin del día de la fecha dada, en hora local — el default para una asignación de un partido. */
export function finDelDia(fecha?: string): string | undefined {
  if (!fecha) return undefined;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function nombreDeUsuario(a: BackendAsignacionPartido): string {
  const u = a.usuarioId;
  if (!u) return 'Usuario';
  if (typeof u === 'string') return u;
  return u.nombre || u.email || u._id;
}

export function emailDeUsuario(a: BackendAsignacionPartido): string | undefined {
  const u = a.usuarioId;
  return typeof u === 'string' ? undefined : u.email;
}
