import { authFetch } from '../../../shared/utils/authFetch';

export type FilaTabla = {
  _id: string;
  equipo: { _id: string; nombre: string; escudo: string | null } | null;
  grupo: string | null;
  division: string | null;
  /**
   * Posición ya calculada por el backend aplicando los criterios de desempate de la fase.
   * Es `null` cuando la fase nunca fue recalculada por la organización.
   *
   * Ojo: en fases tipo `grupo` (y en ligas con divisiones) la posición es RELATIVA al grupo,
   * no global — `StandingsService` ordena cada grupo por separado. Por eso hay que numerar
   * dentro de cada bloque y nunca sobre la lista entera.
   */
  posicion: number | null;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;
  diferenciaPuntos: number;
  clasificado: boolean;
  eliminado: boolean;
};

export type TablaFase = {
  fase: { _id: string; nombre?: string; tipo?: string };
  /**
   * `false` significa que la organización todavía no corrió el recálculo de la fase, así que
   * las posiciones vienen del orden de respaldo (puntos, luego diferencia) y no del criterio
   * de desempate configurado. La UI tiene que decirlo: una tabla provisoria presentada como
   * oficial es peor que no mostrar tabla.
   */
  calculada: boolean;
  posiciones: FilaTabla[];
};

/**
 * Tabla de posiciones de una fase, ya ordenada por el backend.
 *
 * El endpoint es público (no lleva middleware de auth) porque lo consume el portal de hinchas
 * sin sesión iniciada. Es de sólo lectura: el recálculo, que reordena y escribe las posiciones
 * en la base, es una acción del organizador y no algo que dispare abrir una pantalla.
 */
export const getTablaFase = (faseId: string) =>
  authFetch<TablaFase>(`/fases/${faseId}/tabla`, { useAuth: false });

/**
 * Orden de respaldo, idéntico al que aplica el backend cuando `posicion` es null.
 *
 * Existe para el caso en que la tabla llega por props ya cargada desde otra pantalla (que no
 * pasa por `getTablaFase`) y hay que garantizar el mismo orden. Nunca reordena por puntos si
 * el backend ya calculó las posiciones: hacerlo es exactamente el bug que descartaba los
 * criterios de desempate de la fase.
 */
export function ordenarFilas<T extends { posicion?: number | null; puntos: number; diferenciaPuntos: number }>(
  filas: T[],
): T[] {
  return [...filas].sort((a, b) => {
    const pa = a.posicion ?? null;
    const pb = b.posicion ?? null;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    // `posicion` null va al final: es una fase sin recalcular, no un último puesto.
    if (pa === null && pb !== null) return 1;
    if (pb === null && pa !== null) return -1;
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    return b.diferenciaPuntos - a.diferenciaPuntos;
  });
}

/** Misma regla que usa el backend para decidir el flag `calculada` de la respuesta. */
export const estaCalculada = (filas: Array<{ posicion?: number | null }>) =>
  filas.some((f) => (f.posicion ?? null) !== null);
