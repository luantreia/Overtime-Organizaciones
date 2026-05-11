// Tipos para roles y permisos de organización
export type OrgMemberRole = 
  | 'presidente'
  | 'secretario'
  | 'tesorero'
  | 'delegado'
  | 'arbitro'
  | 'coordinador'
  | 'staff';

export type OrgPermission = 
  | 'org.*'                     // Todos los permisos
  | 'org.view_private'           // Ver datos privados
  | 'org.finances'              // Gestión financiera
  | 'org.settings.manage'        // Configuración de organización
  | 'teams.manage'               // Gestionar equipos
  | 'teams.view'                // Ver equipos
  | 'teams.create'              // Crear nuevos equipos
  | 'events.manage'              // Gestionar eventos/competiciones
  | 'events.create'              // Crear nuevos eventos
  | 'matches.approve'           // Aprobar partidos
  | 'matches.referee'            // Arbitrar partidos
  | 'members.manage'             // Gestionar miembros
  | 'members.invite'            // Invitar nuevos miembros
  | 'stats.view_private'         // Ver estadísticas privadas
  | 'stats.manage';              // Gestionar estadísticas de organización

export interface OrgMember {
  _id: string;
  organizacionId: string;
  usuarioId: string;
  rol: OrgMemberRole;
  permisos: OrgPermission[];
  estado: 'activo' | 'suspendido' | 'inactivo';
  notas?: string;
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
  usuarioDetails?: {
    _id: string;
    nombre: string;
    email: string;
  };
  creadoPorDetails?: {
    _id: string;
    nombre: string;
    email: string;
  };
  organizacion?: {
    _id: string;
    nombre: string;
  };
}

export interface OrgPermissions {
  organizacionId: string;
  canManageTeams: boolean;
  canManageEvents: boolean;
  canManageMembers: boolean;
  canViewPrivate: boolean;
  canManageFinances?: boolean;
  canCreateTeams?: boolean;
  canCreateEvents?: boolean;
  canApproveMatches?: boolean;
  canRefereeMatches?: boolean;
  canInviteMembers?: boolean;
  canManageStats?: boolean;
  canManageSettings?: boolean;
}

export interface CreateOrgMemberData {
  usuarioId: string;
  rol: OrgMemberRole;
  permisos?: OrgPermission[];
  notas?: string;
}

export interface UpdateOrgMemberData {
  rol?: OrgMemberRole;
  permisos?: OrgPermission[];
  estado?: 'activo' | 'suspendido' | 'inactivo';
  notas?: string;
}

export const ORG_MEMBER_ROLE_OPTIONS: Array<{ value: OrgMemberRole; label: string }> = [
  { value: 'presidente', label: 'Presidente' },
  { value: 'secretario', label: 'Secretario' },
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'delegado', label: 'Delegado' },
  { value: 'arbitro', label: 'Árbitro' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'staff', label: 'Staff' },
];

export const ORG_PERMISSION_OPTIONS: Array<{ value: OrgPermission; label: string }> = [
  { value: 'org.*', label: 'Control total de organización' },
  { value: 'org.view_private', label: 'Ver datos privados' },
  { value: 'org.finances', label: 'Gestión financiera' },
  { value: 'org.settings.manage', label: 'Configuración de organización' },
  { value: 'teams.manage', label: 'Gestionar equipos' },
  { value: 'teams.view', label: 'Ver equipos' },
  { value: 'teams.create', label: 'Crear equipos' },
  { value: 'events.manage', label: 'Gestionar eventos' },
  { value: 'events.create', label: 'Crear eventos' },
  { value: 'matches.approve', label: 'Aprobar partidos' },
  { value: 'matches.referee', label: 'Arbitrar partidos' },
  { value: 'members.manage', label: 'Gestionar miembros' },
  { value: 'members.invite', label: 'Invitar miembros' },
  { value: 'stats.view_private', label: 'Ver estadísticas privadas' },
  { value: 'stats.manage', label: 'Gestionar estadísticas' },
];
