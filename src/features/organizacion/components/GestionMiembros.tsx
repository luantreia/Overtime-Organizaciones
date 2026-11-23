import { useState, useEffect, useCallback } from 'react';
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
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import { DataTable } from 'overtime-kit';

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
  const [confirmEliminarMiembro, setConfirmEliminarMiembro] = useState<OrgMember | null>(null);

  const cargarMiembros = useCallback(async () => {
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
  }, [canManageMembers, organizacionId, addToast]);

  useEffect(() => {
    cargarMiembros();
  }, [organizacionId, canManageMembers, cargarMiembros]);

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

  const handleEliminarMiembro = (miembro: OrgMember) => {
    setConfirmEliminarMiembro(miembro);
  };

  const handleConfirmEliminarMiembro = async () => {
    if (!confirmEliminarMiembro) return;
    const miembro = confirmEliminarMiembro;
    setConfirmEliminarMiembro(null);
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
    setEmail((miembro.usuarioId as any)?.email || '');
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
    return styles[estado as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  if (!canManageMembers) {
    return (
      <div className="rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-500">No tienes permisos para gestionar miembros de esta organización.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Miembros de la Organización</h3>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-brand-600 hover:bg-brand-700"
        >
          Agregar Miembro
        </Button>
      </div>

      {/* Formulario de agregar/editar */}
      {showAddForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-md font-medium">
            {editingMember ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}
          </h4>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="miembro-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email del Usuario
              </label>
              <Input
                id="miembro-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                disabled={!!editingMember}
              />
            </div>
            
            <div>
              <label htmlFor="miembro-rol" className="mb-1 block text-sm font-medium text-slate-700">
                Rol
              </label>
              <Select
                id="miembro-rol"
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
            <label htmlFor="miembro-permisos" className="mb-1 block text-sm font-medium text-slate-700">
              Permisos Adicionales (opcional)
            </label>
            <Select
                id="miembro-permisos"
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
            <label htmlFor="miembro-notas" className="mb-1 block text-sm font-medium text-slate-700">
              Notas (opcional)
            </label>
            <Input
                id="miembro-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas sobre el miembro..."
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              onClick={editingMember ? handleActualizarMiembro : handleAgregarMiembro}
              disabled={submitting || (!editingMember && !email.trim())}
              className="bg-brand-600 hover:bg-brand-700"
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
      <DataTable
        caption="Miembros de la organización"
        data={miembros}
        rowKey={(m) => m._id}
        loading={loading}
        empty="No hay miembros en esta organización."
        columns={[
          {
            id: 'miembro',
            header: 'Miembro',
            sortValue: (m) => (m.usuarioId as any)?.nombre,
            cell: (m) => (
              <div className="whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{(m.usuarioId as any)?.nombre || 'Usuario'}</div>
                <div className="text-sm text-slate-500">{(m.usuarioId as any)?.email || ''}</div>
              </div>
            ),
          },
          {
            id: 'rol',
            header: 'Rol',
            sortValue: (m) => m.rol,
            cell: (m) => <span className="text-sm text-slate-900">{ORG_MEMBER_ROLE_OPTIONS.find((opt) => opt.value === m.rol)?.label || m.rol}</span>,
          },
          {
            id: 'estado',
            header: 'Estado',
            sortValue: (m) => m.estado,
            cell: (m) => <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadge(m.estado)}`}>{m.estado}</span>,
          },
          { id: 'notas', header: 'Notas', hideOnMobile: true, cell: (m) => <span className="text-sm text-slate-500">{m.notas || '-'}</span> },
          {
            id: 'acciones',
            header: <span className="sr-only">Acciones</span>,
            cell: (m) => (
              <div className="flex gap-2">
                <Button onClick={() => startEdit(m)} variant="outline" size="sm">
                  Editar
                </Button>
                <Button onClick={() => handleEliminarMiembro(m)} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300">
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <ConfirmModal
        isOpen={!!confirmEliminarMiembro}
        title="Eliminar miembro"
        message={`¿Estás seguro de eliminar a ${(confirmEliminarMiembro?.usuarioId as any)?.nombre || 'este miembro'}?`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmEliminarMiembro}
        onCancel={() => setConfirmEliminarMiembro(null)}
      />
    </div>
  );
};

export default GestionMiembros;
