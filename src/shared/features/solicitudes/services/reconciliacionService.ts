import { authFetch } from '../../../utils/authFetch';

/**
 * Reconciliación de un partido: todas sus versiones (lo oficial y cada planilla que la
 * organización puede ver) lado a lado, y la publicación de una versión combinada
 * eligiendo qué fuente manda para cada equipo.
 *
 * Espeja overtime/src/services/reconciliacionPlanillasService.js.
 */

export const FUENTE_OFICIAL = 'oficial';

export type Totales = { throws: number; hits: number; outs: number; catches: number };

export interface FuenteReconciliacion {
  id: string;
  tipo: 'oficial' | 'planilla';
  tipoDuenio: 'equipo' | 'jugador' | 'organizacion' | null;
  equipoDuenio: { _id: string; nombre?: string } | null;
  estado: 'borrador' | 'pendiente_oficializacion' | 'oficializada' | 'rechazada' | null;
  modo: 'sets' | 'directa';
  actualizada: string | null;
}

export interface FilaJugadorReconciliacion {
  jugador: { _id: string; nombre?: string; apellido?: string; alias?: string };
  equipo: string;
  /** fuenteId → totales. Si una fuente no tiene al jugador, no aparece acá (ver `ausenteEn`). */
  valores: Record<string, Totales>;
  ausenteEn: string[];
  difiere: boolean;
  /** Filas oficiales que existen hoy para el jugador: si es > 0, publicar las reemplaza. */
  filasOficiales: number;
}

export interface FilaSetReconciliacion {
  numeroSet: number;
  valores: Record<string, string>;
  difiere: boolean;
}

export interface Reconciliacion {
  partido: {
    _id: string;
    equipoLocal?: { _id: string; nombre?: string };
    equipoVisitante?: { _id: string; nombre?: string };
    modoEstadisticas?: 'automatico' | 'manual';
  };
  puedePublicar: boolean;
  fuentes: FuenteReconciliacion[];
  jugadores: FilaJugadorReconciliacion[];
  sets: FilaSetReconciliacion[];
  hayDiferencias: boolean;
}

export interface PublicarReconciliacionBody {
  /** equipoId → planillaId | 'oficial' */
  fuentePorEquipo: Record<string, string>;
  visibilidad: 'organizacion' | 'publica';
  confirmarSobrescritura?: boolean;
}

export interface ResultadoPublicacion {
  planillaOrganizacion: string;
  modo: 'sets' | 'directa';
  equiposAplicados: string[];
  reemplazos: number;
  avisos: string[];
}

/** Lo que devuelve el 409 cuando hay estadísticas oficiales que se reemplazarían. */
export interface ConfirmacionRequerida {
  requiereConfirmacion: true;
  reemplazos: Array<{ jugador: FilaJugadorReconciliacion['jugador']; equipo: string; antes: Totales | null }>;
  avisos: string[];
}

export const getReconciliacion = (partidoId: string) =>
  authFetch<Reconciliacion>(`/planillas-equipo/reconciliacion/${partidoId}`);

/**
 * Publica. Si el backend pide confirmación devuelve `{ confirmacion }` en vez de tirar:
 * es un paso normal del flujo, no un error.
 */
export const publicarReconciliacion = async (
  partidoId: string,
  body: PublicarReconciliacionBody,
): Promise<{ resultado: ResultadoPublicacion } | { confirmacion: ConfirmacionRequerida }> => {
  try {
    const resultado = await authFetch<ResultadoPublicacion>(
      `/planillas-equipo/reconciliacion/${partidoId}/publicar`,
      { method: 'POST', body: body as unknown as Record<string, unknown> },
    );
    return { resultado };
  } catch (e) {
    const err = e as { status?: number; details?: ConfirmacionRequerida };
    if (err.status === 409 && err.details?.requiereConfirmacion) return { confirmacion: err.details };
    throw e;
  }
};
