import { useState, useEffect } from 'react';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { 
  getMiembrosOrganizacion, 
  agregarMiembroOrganizacion, 
  actualizarMiembroOrganizacion, 
  eliminarMiembroOrganizacion,
  buscarUsuarioPorEmail 
} from '../../../shared/services/orgService';
import type { 
  OrgMember, 
  OrgMemberRole, 
  OrgPermission,
  CreateOrgMemberData,
  UpdateOrgMemberData
} from '../../../shared/utils/types/orgTypes';
import { 
  ORG_MEMBER_ROLE_OPTIONS,
  ORG_PERMISSION_OPTIONS
} from '../../../shared/utils/types/orgTypes';
import { Button, Input, Select } from '../../../shared/components/ui';

interface GestionMiembrosProps {
  organizacionId: string;
  canManageMembers: boolean;
}

const GestionMiembros: React.FC<GestionMiembrosProps> = ({ 
  organizacionId, 
  canManageMembers 
}) => {
  const { addToast } = useToast();
  const [miembros, setMiembros] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<OrgMemberRole>('staff');
  const [permisos, setPermisos] = useState<OrgPermission[]>([]);
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cargarMiembros = async () => {
    if (!canManageMembers) return;
    
    try {
      setLoading(true);
      const data = await getMiembrosOrganizacion(organizacionId);
      setMiembros(data);
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los miembros' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMiembros();
  }, [organizacionId, canManageMembers]);

  const resetForm = () => {
    setEmail('');
    setRol('staff');
    setPermisos([]);
    setNotas('');
    setEditingMember(null);
    setShowAddForm(false);
  };

  const handleAgregarMiembro = async () => {
    if (!email.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'El email es requerido' });
      return;
    }

    try {
      setSubmitting(true);
      
      // Buscar usuario por email
      const usuario = await buscarUsuarioPorEmail(email.trim());
      if (!usuario) {
        addToast({ type: 'error', title: 'Error', message: 'Usuario no encontrado' });
        return;
      }

      const miembroData: CreateOrgMemberData = {
        usuarioId: usuario._id,
        rol,
        permisos: permisos.length > 0 ? permisos : undefined,
        notas: notas.trim() || undefined,
      };

      await agregarMiembroOrganizacion(organizacionId, miembroData);
      addToast({ type: 'success', title: 'Éxito', message: 'Miembro agregado correctamente' });
      resetForm();
      cargarMiembros();
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'No pudimos agregar el miembro' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActualizarMiembro = async () => {
    if (!editingMember) return;

    try {
      setSubmitting(true);
      
      const updateData: UpdateOrgMemberData = {
        rol,
        permisos: permisos.length > 0 ? permisos : undefined,
        notas: notas.trim() || undefined,
      };

      await actualizarMiembroOrganizacion(organizacionId, editingMember._id, updateData);
      addToast({ type: 'success', title: 'Éxito', message: 'Miembro actualizado correctamente' });
      resetForm();
      cargarMiembros();
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'No pudimos actualizar el miembro' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarMiembro = async (miembro: OrgMember) => {
    if (!confirm(`¿Estás seguro de eliminar a ${miembro.usuarioId?.nombre || 'este miembro'}?`)) {
      return;
    }

    try {
      await eliminarMiembroOrganizacion(organizacionId, miembro._id);
      addToast({ type: 'success', title: 'Éxito', message: 'Miembro eliminado correctamente' });
      cargarMiembros();
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'No pudimos eliminar el miembro' });
    }
  };

  const startEdit = (miembro: OrgMember) => {
    setEditingMember(miembro);
    setEmail(miembro.usuarioId?.email || '');
    setRol(miembro.rol);
    setPermisos(miembro.permisos || []);
    setNotas(miembro.notas || '');
    setShowAddForm(true);
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      suspendido: 'bg-yellow-100 text-yellow-800',
      inactivo: 'bg-red-100 text-red-800',
    };
    return styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (!canManageMembers) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">No tienes permisos para gestionar miembros de esta organización.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Miembros de la Organización</h3>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Agregar Miembro
        </Button>
      </div>

      {/* Formulario de agregar/editar */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-md font-medium">
            {editingMember ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}
          </h4>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email del Usuario
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                disabled={!!editingMember}
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rol
              </label>
              <Select
                value={rol}
                onChange={(e) => setRol(e.target.value as OrgMemberRole)}
              >
                {ORG_MEMBER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Permisos Adicionales (opcional)
            </label>
            <Select
              multiple
              value={permisos}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value) as OrgPermission[];
                setPermisos(selected);
              }}
              className="h-24"
            >
              {ORG_PERMISSION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <Input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas sobre el miembro..."
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              onClick={editingMember ? handleActualizarMiembro : handleAgregarMiembro}
              disabled={submitting || (!editingMember && !email.trim())}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Guardando...' : editingMember ? 'Actualizar' : 'Agregar'}
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de miembros */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando miembros...</p>
        </div>
      ) : miembros.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay miembros en esta organización.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Miembro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Notas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {miembros.map((miembro) => (
                <tr key={miembro._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {(miembro.usuarioId as any)?.nombre || 'Usuario'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(miembro.usuarioId as any)?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {ORG_MEMBER_ROLE_OPTIONS.find(opt => opt.value === miembro.rol)?.label || miembro.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadge(miembro.estado)}`}>
                      {miembro.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {miembro.notas || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(miembro)}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleEliminarMiembro(miembro)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestionMiembros;
