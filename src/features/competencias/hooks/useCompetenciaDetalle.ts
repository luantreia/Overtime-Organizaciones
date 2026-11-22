import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCompetenciaDetalle,
  type AdminUser,
  type BackendFase,
  type BackendParticipacionFase,
  type BackendParticipacionTemporada,
  type BackendTemporada,
} from '../services';
import { useAuth } from '../../../app/providers/AuthContext';

export type Modalidad = 'Foam' | 'Cloth' | '';
export type Categoria = 'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | '';
export type TipoCompetencia = 'liga' | 'torneo' | 'otro' | '';

/** Los campos editables de la competencia, tal como los muestra el formulario de General. */
export interface DatosCompetencia {
  nombre: string;
  modalidad: Modalidad;
  categoria: Categoria;
  tipo: TipoCompetencia;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
  rankedEnabled: boolean;
}

const DATOS_VACIOS: DatosCompetencia = {
  nombre: '',
  modalidad: '',
  categoria: '',
  tipo: '',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
  rankedEnabled: false,
};

/**
 * Lo que comparten las pestañas del detalle de una competencia: los datos de la competencia, su
 * estructura (temporadas → fases → participaciones) y si el usuario puede administrarla.
 *
 * Lo que es de UNA sola pestaña (el formulario de General, los filtros de Partidos, los modales de
 * confirmación de Estructura) no vive acá: vive en esa pestaña. Así la página queda como una
 * cáscara que elige qué pestaña mostrar, y cada pestaña se entiende leyendo un solo archivo.
 *
 * `setFasesPorTemporada` y compañía se exponen porque Estructura refresca una temporada o una fase
 * puntual después de editarla, sin recargar el árbol entero.
 */
export function useCompetenciaDetalle(competenciaId: string | undefined) {
  const { user } = useAuth();
  const [datos, setDatos] = useState<DatosCompetencia>(DATOS_VACIOS);
  const [organizacionId, setOrganizacionId] = useState('');
  const [esAdminBackend, setEsAdminBackend] = useState<boolean | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [temporadas, setTemporadas] = useState<BackendTemporada[]>([]);
  const [fasesPorTemporada, setFasesPorTemporada] = useState<Record<string, BackendFase[]>>({});
  const [participacionesTemporada, setParticipacionesTemporada] = useState<Record<string, BackendParticipacionTemporada[]>>({});
  const [participacionesFase, setParticipacionesFase] = useState<Record<string, BackendParticipacionFase[]>>({});
  const [loading, setLoading] = useState(false);

  const recargar = useCallback(async () => {
    if (!competenciaId) return;
    setLoading(true);
    try {
      const detalle = await getCompetenciaDetalle(competenciaId);

      setDatos({
        nombre: detalle.nombre ?? 'Competencia',
        modalidad: (detalle.modalidad as Modalidad) ?? '',
        categoria: (detalle.categoria as Categoria) ?? '',
        tipo: (detalle.tipo as TipoCompetencia) ?? '',
        fechaInicio: detalle.fechaInicio ? detalle.fechaInicio.slice(0, 10) : '',
        fechaFin: detalle.fechaFin ? detalle.fechaFin.slice(0, 10) : '',
        descripcion: (detalle as any).descripcion ?? '',
        rankedEnabled: Boolean(detalle.rankedEnabled),
      });
      setEsAdminBackend(Boolean(detalle.esAdmin));
      setAdmins((detalle.administradores as AdminUser[]) || []);
      const org = (detalle as any).organizacion;
      setOrganizacionId(typeof org === 'string' ? org : org?._id ?? '');

      const temps = detalle.temporadas ?? [];
      setTemporadas(temps as unknown as BackendTemporada[]);

      const fasesMap: Record<string, BackendFase[]> = {};
      const ptsMap: Record<string, BackendParticipacionTemporada[]> = {};
      const pfMap: Record<string, BackendParticipacionFase[]> = {};
      for (const t of temps) {
        fasesMap[t._id] = t.fases as unknown as BackendFase[];
        ptsMap[t._id] = t.participaciones as unknown as BackendParticipacionTemporada[];
        for (const f of t.fases) {
          pfMap[f._id] = f.participaciones as unknown as BackendParticipacionFase[];
        }
      }
      setFasesPorTemporada(fasesMap);
      setParticipacionesTemporada(ptsMap);
      setParticipacionesFase(pfMap);
    } finally {
      setLoading(false);
    }
  }, [competenciaId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const esAdmin = useMemo(() => {
    if (esAdminBackend) return true;
    if (user?.rol === 'admin' || user?.rol === 'manager' || user?.rol === 'editor') return true;
    if (user) {
      const uEmail = (user.email || '').trim().toLowerCase();
      if (admins.some((a) => a._id === user.id)) return true;
      if (uEmail && admins.some((a) => (a.email || '').trim().toLowerCase() === uEmail)) return true;
    }
    return false;
  }, [esAdminBackend, user, admins]);

  return {
    datos,
    organizacionId,
    esAdmin,
    admins,
    setAdmins,
    temporadas,
    setTemporadas,
    fasesPorTemporada,
    setFasesPorTemporada,
    participacionesTemporada,
    setParticipacionesTemporada,
    participacionesFase,
    setParticipacionesFase,
    loading,
    recargar,
  };
}

export type CompetenciaDetalle = ReturnType<typeof useCompetenciaDetalle>;
