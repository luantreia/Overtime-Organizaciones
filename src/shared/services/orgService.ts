// Servicios para gestión de organizaciones
import { authFetch } from '../utils/authFetch';
import type { 
  OrgMember, 
  OrgPermissions, 
  CreateOrgMemberData, 
  UpdateOrgMemberData,
  OrgMemberRole,
  OrgPermission 
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
  return authFetch(`/organizaciones/${organizacionId}/miembros`, {
    method: 'POST',
    body: JSON.stringify(data),
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
    body: JSON.stringify(data),
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
    const response = await authFetch(`/usuarios?email=${encodeURIComponent(email)}`);
    return response as {
      _id: string;
      nombre: string;
      email: string;
    } | null;
  } catch (error) {
    console.error('Error buscando usuario por email:', error);
    return null;
  }
};
