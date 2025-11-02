import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getOrganizacionesDelUsuario } from '../../features/organizacion/services/organizacionService';
import type { Organizacion } from '../../types';

type OrganizacionContextValue = {
  organizaciones: Organizacion[];
  organizacionSeleccionada: Organizacion | null;
  loading: boolean;
  seleccionarOrganizacion: (organizacionId: string) => void;
  recargarOrganizaciones: () => Promise<void>;
};

const OrganizacionContext = createContext<OrganizacionContextValue | undefined>(undefined);

const ORGANIZACION_STORAGE_KEY = 'overtime_organizacion_actual';

export const OrganizacionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [organizacionSeleccionada, setOrganizacionSeleccionada] = useState<Organizacion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const cargarOrganizaciones = useCallback(async () => {
    try {
      setLoading(true);
      const organizacionesUsuario = await getOrganizacionesDelUsuario();
      setOrganizaciones(organizacionesUsuario);

      const storedOrganizacionId = localStorage.getItem(ORGANIZACION_STORAGE_KEY);
      if (storedOrganizacionId) {
        const matched = organizacionesUsuario.find((o: Organizacion) => o.id === storedOrganizacionId);
        if (matched) {
          setOrganizacionSeleccionada(matched);
          return;
        }
      }

      setOrganizacionSeleccionada(organizacionesUsuario[0] ?? null);
    } catch (error) {
      console.error('Error cargando organizaciones', error);
      setOrganizaciones([]);
      setOrganizacionSeleccionada(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarOrganizaciones();
  }, [cargarOrganizaciones]);

  const seleccionarOrganizacion = useCallback(
    (organizacionId: string) => {
      const next = organizaciones.find((o) => o.id === organizacionId) ?? null;
      setOrganizacionSeleccionada(next);
      if (next) {
        localStorage.setItem(ORGANIZACION_STORAGE_KEY, next.id);
      } else {
        localStorage.removeItem(ORGANIZACION_STORAGE_KEY);
      }
    },
    [organizaciones]
  );

  const value = useMemo(
    () => ({
      organizaciones,
      organizacionSeleccionada,
      loading,
      seleccionarOrganizacion,
      recargarOrganizaciones: cargarOrganizaciones,
    }),
    [organizaciones, organizacionSeleccionada, loading, seleccionarOrganizacion, cargarOrganizaciones]
  );

  return <OrganizacionContext.Provider value={value}>{children}</OrganizacionContext.Provider>;
};

export const useOrganizacion = () => {
  const context = useContext(OrganizacionContext);
  if (!context) {
    throw new Error('useOrganizacion debe utilizarse dentro de OrganizacionProvider');
  }
  return context;
};
