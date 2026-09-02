import { authFetch } from '../../../utils/authFetch';

/**
 * Lectura de la planilla de un equipo para revisarla antes de oficializarla.
 *
 * Los tipos espejan overtime/src/models/Equipo/Planilla*.js. La verdad vive en los
 * schemas de Mongoose: si agregás un estado o un modo, agregalo primero allá.
 */

export interface PlanillaJugadorRef {
  _id: string;
  nombre?: string;
  apellido?: string;
  alias?: string;
}

export interface PlanillaPresente {
  _id: string;
  jugador: PlanillaJugadorRef | string;
  jugadorPartido: string | null;
  numero?: number;
  rol: 'jugador' | 'entrenador';
}

export interface PlanillaSet {
  _id: string;
  numeroSet: number;
  ganadorSet: 'local' | 'visitante' | 'empate' | 'pendiente';
  setPartido: string | null;
}

export interface PlanillaEstadistica {
  _id: string;
  planillaSet: string | null;
  planillaPresente: string;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  survive: boolean;
}

export interface PlanillaCompleta {
  _id: string;
  partido: string;
  equipo: string | { _id: string; nombre?: string; escudo?: string };
  modo: 'sets' | 'directa';
  estado: 'borrador' | 'pendiente_oficializacion' | 'oficializada' | 'rechazada';
  visibilidadObjetivo: 'organizacion' | 'publica';
  presentes: PlanillaPresente[];
  sets: PlanillaSet[];
  estadisticas: PlanillaEstadistica[];
}

export interface JugadorPartidoOficial {
  _id: string;
  jugador: PlanillaJugadorRef | string;
  numero?: number;
}

export interface EstadisticaOficial {
  _id: string;
  set: string;
  jugadorPartido: string;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
}

export interface RevisionPlanilla {
  planilla: PlanillaCompleta;
  oficial: {
    sets: Array<{ _id: string; numeroSet: number; ganadorSet: string }>;
    convocatoria: JugadorPartidoOficial[];
    estadisticas: EstadisticaOficial[];
  };
}

export const getRevisionPlanilla = (planillaId: string) =>
  authFetch<RevisionPlanilla>(`/planillas-equipo/${planillaId}/revision`);

export const nombreDeJugador = (j: PlanillaJugadorRef | string | undefined): string => {
  if (!j || typeof j === 'string') return 'Jugador';
  return j.alias || [j.nombre, j.apellido].filter(Boolean).join(' ') || 'Jugador';
};

/** Totales por presente según la planilla, sumando todos los sets. */
export const totalesPlanilla = (
  planilla: PlanillaCompleta,
): Record<string, { throws: number; hits: number; outs: number; catches: number }> => {
  const acc: Record<string, { throws: number; hits: number; outs: number; catches: number }> = {};
  for (const e of planilla.estadisticas) {
    const k = e.planillaPresente;
    if (!acc[k]) acc[k] = { throws: 0, hits: 0, outs: 0, catches: 0 };
    acc[k].throws += e.throws || 0;
    acc[k].hits += e.hits || 0;
    acc[k].outs += e.outs || 0;
    acc[k].catches += e.catches || 0;
  }
  return acc;
};

/**
 * Totales oficiales por jugadorPartido. Se comparan contra los de la planilla para
 * marcar en qué jugadores difieren; los presentes que todavía no tienen convocatoria
 * oficial no tienen contraparte y se muestran como altas nuevas.
 */
export const totalesOficiales = (
  revision: RevisionPlanilla,
): Record<string, { throws: number; hits: number; outs: number; catches: number }> => {
  const acc: Record<string, { throws: number; hits: number; outs: number; catches: number }> = {};
  for (const e of revision.oficial.estadisticas) {
    const k = String(e.jugadorPartido);
    if (!acc[k]) acc[k] = { throws: 0, hits: 0, outs: 0, catches: 0 };
    acc[k].throws += e.throws || 0;
    acc[k].hits += e.hits || 0;
    acc[k].outs += e.outs || 0;
    acc[k].catches += e.catches || 0;
  }
  return acc;
};
