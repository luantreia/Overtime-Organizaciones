import { ReactNode } from 'react';
import { useOrgPermissions } from '../../../features/organizacion/hooks/useOrgPermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  organizacionId: string | null;
  requiredPermission?: keyof ReturnType<typeof useOrgPermissions>['can'];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  organizacionId,
  requiredPermission,
  fallback = null,
  loadingFallback = <div className="flex items-center justify-center p-8">
    <div className="text-sm text-gray-500">Verificando permisos...</div>
  </div>,
}) => {
  const { can, loading } = useOrgPermissions(organizacionId);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  // Si no se requiere un permiso específico, solo verificar que tenga algún permiso
  if (!requiredPermission) {
    const hasAnyPermission = Object.values(can).some(Boolean);
    return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
  }

  // Verificar permiso específico
  return can[requiredPermission] ? <>{children}</> : <>{fallback}</>;
};

// Componente para proteger rutas que requieren permisos específicos
export const ProtectedOrgRoute: React.FC<ProtectedRouteProps & { 
  organizacionId: string;
  message?: string;
}> = ({ 
  children, 
  organizacionId, 
  requiredPermission,
  message = 'No tienes permisos para acceder a esta sección.',
  fallback = (
    <div className="rounded-lg border border-gray-200 p-6 text-center">
      <div className="text-gray-500">
        <div className="mb-2 text-lg">🔒</div>
        <p>{message}</p>
      </div>
    </div>
  )
}) => {
  return (
    <ProtectedRoute
      organizacionId={organizacionId}
      requiredPermission={requiredPermission}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  );
};
