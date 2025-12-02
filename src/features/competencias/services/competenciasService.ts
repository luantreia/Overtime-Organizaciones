import { authFetch } from '../../../shared/utils/authFetch';

export type BackendCompetencia = {
  _id: string;
  nombre?: string;
  organizacion?: { _id: string; nombre?: string } | string;
  modalidad?: string;
  categoria?: string;
  tipo?: 'liga' | 'torneo' | 'otro' | string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion?: string;
  rankedEnabled?: boolean;
};

export type AdminUser = { _id: string; email?: string; nombre?: string };

export type BackendCompetenciaDetalle = BackendCompetencia & {
  esAdmin?: boolean;
  administradores?: AdminUser[];
};

export async function listCompetencias(): Promise<BackendCompetencia[]> {
  return authFetch<BackendCompetencia[]>('/competencias');
}

export async function listCompetenciasByOrganizacion(organizacionId: string): Promise<BackendCompetencia[]> {
  const all = await listCompetencias();
  return all.filter((c) => {
    const org = c.organizacion;
    if (!org) return false;
    if (typeof org === 'string') return org === organizacionId;
    return org._id === organizacionId;
  });
}

export type CrearCompetenciaPayload = {
  organizacion: string;
  modalidad: 'Foam' | 'Cloth';
  categoria: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';
  tipo?: 'liga' | 'torneo' | 'otro';
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  rankedEnabled?: boolean;
};

export async function crearCompetencia(payload: CrearCompetenciaPayload): Promise<BackendCompetencia> {
  return authFetch<BackendCompetencia>('/competencias', { method: 'POST', body: payload });
}

export async function actualizarCompetencia(id: string, body: Partial<CrearCompetenciaPayload & { nombre?: string; estado?: string }>): Promise<BackendCompetencia> {
  return authFetch<BackendCompetencia>(`/competencias/${id}`, { method: 'PUT', body });
}

export async function eliminarCompetencia(id: string): Promise<{ mensaje?: string } | undefined> {
  return authFetch<{ mensaje: string }>(`/competencias/${id}`, { method: 'DELETE' });
}

export async function getCompetenciaAdministradores(id: string): Promise<{ administradores: AdminUser[] }> {
  return authFetch<{ administradores: AdminUser[] }>(`/competencias/${id}/administradores`);
}

export async function addCompetenciaAdministrador(id: string, payload: { adminUid?: string; email?: string }) {
  return authFetch<{ administradores: AdminUser[] }>(`/competencias/${id}/administradores`, { method: 'POST', body: payload });
}

export async function removeCompetenciaAdministrador(id: string, adminUid: string) {
  return authFetch<{ administradores: AdminUser[] }>(`/competencias/${id}/administradores/${adminUid}`, { method: 'DELETE' });
}

export async function getCompetenciaById(id: string): Promise<BackendCompetenciaDetalle> {
  return authFetch<BackendCompetenciaDetalle>(`/competencias/${id}`);
}
