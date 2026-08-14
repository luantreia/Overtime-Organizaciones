// Servicios para gestión de organizaciones
import { authFetch } from '../utils/authFetch';
import type { 
  OrgMember, 
  OrgPermissions,
  CreateOrgMemberData,
  UpdateOrgMemberData
} from '../utils/types/orgTypes';

// Obtener permisos del usuario en una organización
export const getMisPermisosOrganizacion = async (organizacionId: string): Promise<OrgPermissions> => {
  return authFetch(`/organizaciones/${organizacionId}/mis-permisos`);
};

// Obtener miembros de una organización
export const getMiembrosOrganizacion = async (organizacionId: string): Promise<OrgMember[]> => {
  return authFetch(`/organizaciones/${organizacionId}/miembros`);
};

// Agregar miembro a organización
export const agregarMiembroOrganizacion = async (
  organizacionId: string, 
  data: CreateOrgMemberData
): Promise<OrgMember> => {
  // authFetch ya serializa el body: pasarle un string acá lo dejaba doble-codificado
  // (`"{\"rol\":\"staff\"}"`) y el backend respondía 400 "is not valid JSON".
  return authFetch(`/organizaciones/${organizacionId}/miembros`, {
    method: 'POST',
    body: { ...data },
  });
};

// Actualizar miembro de organización
export const actualizarMiembroOrganizacion = async (
  organizacionId: string,
  miembroId: string,
  data: UpdateOrgMemberData
): Promise<OrgMember> => {
  return authFetch(`/organizaciones/${organizacionId}/miembros/${miembroId}`, {
    method: 'PUT',
    body: { ...data },
  });
};

// Eliminar miembro de organización
export const eliminarMiembroOrganizacion = async (
  organizacionId: string,
  miembroId: string
): Promise<{ message: string }> => {
  return authFetch(`/organizaciones/${organizacionId}/miembros/${miembroId}`, {
    method: 'DELETE',
  });
};

// Buscar usuario por email para agregar como miembro
export const buscarUsuarioPorEmail = async (email: string): Promise<{
  _id: string;
  nombre: string;
  email: string;
} | null> => {
  try {
    // GET /usuarios?email= devuelve { id, nombre, email, rol } — con `id`, no `_id`. El
    // componente leía `_id` y mandaba usuarioId undefined, así que el alta nunca llegaba
    // con usuario. Normalizamos acá para no depender de la forma exacta del endpoint.
    const response = await authFetch<{ id?: string; _id?: string; nombre?: string; email?: string } | null>(
      `/usuarios?email=${encodeURIComponent(email)}`
    );
    if (!response) return null;

    const id = response._id ?? response.id;
    if (!id) return null;

    return { _id: id, nombre: response.nombre ?? '', email: response.email ?? email };
  } catch (error) {
    console.error('Error buscando usuario por email:', error);
    return null;
  }
};
