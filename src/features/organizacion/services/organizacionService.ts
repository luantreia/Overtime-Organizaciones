import { authFetch } from '../../../shared/utils/authFetch';
import type { Organizacion } from '../../../types';

type BackendOrganizacion = {
  _id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  sitioWeb?: string;
  activa?: boolean;
};

const mapOrganizacion = (o: BackendOrganizacion): Organizacion => ({
  id: o._id,
  nombre: o.nombre,
  descripcion: o.descripcion,
  logoUrl: o.logo,
  sitioWeb: o.sitioWeb,
});

export async function getOrganizacionesDelUsuario(): Promise<Organizacion[]> {
  const data = await authFetch<BackendOrganizacion[]>('/organizaciones/admin');
  return data.map(mapOrganizacion);
}

export type AdminUser = { _id: string; email?: string; nombre?: string };

export async function getOrganizacionAdministradores(id: string): Promise<{ administradores: AdminUser[] }> {
  return authFetch<{ administradores: AdminUser[] }>(`/organizaciones/${id}/administradores`);
}

export async function addOrganizacionAdministrador(id: string, payload: { adminUid?: string; email?: string }) {
  return authFetch<{ administradores: AdminUser[] }>(`/organizaciones/${id}/administradores`, { method: 'POST', body: payload });
}

export async function removeOrganizacionAdministrador(id: string, adminUid: string) {
  return authFetch<{ administradores: AdminUser[] }>(`/organizaciones/${id}/administradores/${adminUid}`, { method: 'DELETE' });
}
