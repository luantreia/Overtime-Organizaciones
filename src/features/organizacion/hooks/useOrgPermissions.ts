import { useState, useEffect, useCallback } from 'react';
import { getMisPermisosOrganizacion } from '../../../shared/services/orgService';
import type { OrgPermissions } from '../../../shared/utils/types/orgTypes';

export const useOrgPermissions = (organizacionId: string | null) => {
  const [permissions, setPermissions] = useState<OrgPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!organizacionId) {
      setPermissions(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const perms = await getMisPermisosOrganizacion(organizacionId);
      setPermissions(perms);
    } catch (err) {
      console.error('Error cargando permisos de organización:', err);
      setError('No pudimos cargar tus permisos');
    } finally {
      setLoading(false);
    }
  }, [organizacionId]);

  useEffect(() => {
    loadPermissions();
  }, [organizacionId, loadPermissions]);

  const can = {
    manageTeams: permissions?.canManageTeams || false,
    manageEvents: permissions?.canManageEvents || false,
    manageMembers: permissions?.canManageMembers || false,
    viewPrivate: permissions?.canViewPrivate || false,
    manageFinances: permissions?.canManageFinances || false,
    createTeams: permissions?.canCreateTeams || false,
    createEvents: permissions?.canCreateEvents || false,
    approveMatches: permissions?.canApproveMatches || false,
    refereeMatches: permissions?.canRefereeMatches || false,
    inviteMembers: permissions?.canInviteMembers || false,
    manageStats: permissions?.canManageStats || false,
    manageSettings: permissions?.canManageSettings || false,
  };

  const hasAnyPermission = Object.values(can).some(Boolean);

  return {
    permissions,
    loading,
    error,
    can,
    hasAnyPermission,
    refetch: loadPermissions,
  };
};
