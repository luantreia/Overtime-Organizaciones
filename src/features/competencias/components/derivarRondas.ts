/**
 * Deriva las rondas de una llave a partir de los partidos reales, en vez de una lista fija de
 * etapas. Es lo que arregla el bug real de esta pantalla: `STAGE_ORDER` estaba fijo en cuatro
 * valores (`octavos, cuartos, semifinal, final`), pero el enum real de `Partido.etapa` tiene
 * nueve (`overtime/src/models/Partido/Partido.js`): también existen `treintaidosavos`,
 * `dieciseisavos`, `tercer_puesto` y `repechaje`. Con la lista fija, una ronda de repechaje —o
 * un torneo de más de 16 equipos— se descartaba entera y la llave arrancaba en cuartos con
 * equipos que parecían salidos de la nada.
 *
 * La regla para ordenar: en una llave de eliminación directa, una ronda anterior siempre tiene
 * la misma cantidad de partidos o más que la siguiente (octavos ≥ cuartos ≥ semifinal ≥ final).
 * Ese conteo es una señal más confiable que el nombre de la etapa, así que es el criterio
 * principal; el orden conocido de etapas sólo desempata cuando dos rondas tienen la misma
 * cantidad de partidos.
 *
 * `tercer_puesto` se excluye de la secuencia: no es "la ronda después de la final", es un
 * partido en paralelo a ella, y así lo tiene que tratar quien consuma este resultado.
 */

const ORDEN_SECUENCIAL = [
  'treintaidosavos',
  'dieciseisavos',
  'octavos',
  'cuartos',
  'semifinal',
  'final',
] as const;

export type EtapaConocida = (typeof ORDEN_SECUENCIAL)[number];

export const ETAPA_LABELS: Record<string, string> = {
  treintaidosavos: '32vos de Final',
  dieciseisavos: '16vos de Final',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinales',
  final: 'Final',
  repechaje: 'Repechaje',
  otro: 'Otra etapa',
};

const indiceSecuencial = (etapa: string): number => {
  // 'repechaje' desempata ANTES que cualquier etapa conocida: semánticamente alimenta a la
  // ronda con la que compite en cantidad de partidos (una reclasificación con 4 partidos y
  // unos cuartos con 4 partidos no son la misma ronda — la reclasificación va primero). Lo
  // realmente desconocido ('otro', o algo fuera del enum) sigue sin desempate claro y queda
  // al final.
  if (etapa === 'repechaje') return -1;
  const i = ORDEN_SECUENCIAL.indexOf(etapa as EtapaConocida);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/** Forma mínima que necesita cualquier `Partido` para poder agruparse y ordenarse acá. */
export interface PartidoDeLlave {
  id: string;
  etapa?: string;
  posicionBracket?: number;
  fecha?: string;
  hora?: string;
}

export interface RondaLlave<P extends PartidoDeLlave> {
  etapa: string;
  label: string;
  partidos: P[];
}

/** Mismo criterio de orden dentro de una ronda que ya usaban ambas apps: por posición de
 * bracket si está asignada, y si no por fecha+hora, y por id como último desempate estable. */
function ordenarDentroDeRonda<P extends PartidoDeLlave>(partidos: P[]): P[] {
  return [...partidos].sort((a, b) => {
    if (typeof a.posicionBracket === 'number' && typeof b.posicionBracket === 'number') {
      return a.posicionBracket - b.posicionBracket;
    }
    const ta = (a.hora ? `${a.fecha}T${a.hora}` : a.fecha) ?? '';
    const tb = (b.hora ? `${b.fecha}T${b.hora}` : b.fecha) ?? '';
    if (ta !== tb) return ta.localeCompare(tb);
    return (a.id || '').localeCompare(b.id || '');
  });
}

export function derivarRondas<P extends PartidoDeLlave>(partidos: P[]): RondaLlave<P>[] {
  const grupos = new Map<string, P[]>();
  for (const p of partidos) {
    const etapa = (p.etapa || 'otro').toLowerCase();
    if (etapa === 'tercer_puesto') continue;
    const lista = grupos.get(etapa);
    if (lista) lista.push(p);
    else grupos.set(etapa, [p]);
  }

  const entradas = [...grupos.entries()];
  entradas.sort(([etapaA, partidosA], [etapaB, partidosB]) => {
    if (partidosB.length !== partidosA.length) return partidosB.length - partidosA.length;
    return indiceSecuencial(etapaA) - indiceSecuencial(etapaB);
  });

  return entradas.map(([etapa, lista]) => ({
    etapa,
    label: ETAPA_LABELS[etapa] || etapa,
    partidos: ordenarDentroDeRonda(lista),
  }));
}

/** El partido por el tercer puesto, aparte: no forma parte de la secuencia de eliminación. */
export function extraerTercerPuesto<P extends PartidoDeLlave>(partidos: P[]): P | null {
  return partidos.find((p) => (p.etapa || '').toLowerCase() === 'tercer_puesto') ?? null;
}

/**
 * Qué etapas de la secuencia "de bracket" (no `repechaje` ni `otro`, que no tienen una
 * siguiente etapa obvia) hay que ofrecer para crear, aunque todavía no tengan partidos.
 *
 * Regla: desde la primera etapa de `ORDEN_SECUENCIAL` que ya tiene partidos reales, hasta la
 * final — así el organizador ve un placeholder de "+ Crear Cuartos" apenas terminan Octavos,
 * sin tener que esperar a que alguien cree el partido a mano primero. Si ninguna etapa conocida
 * tiene partidos todavía (por ejemplo, sólo hay un repechaje cargado), el placeholder por
 * defecto es sólo la Final — igual que el comportamiento original.
 */
export function etapasSecuencialesAMostrar(etapasConDatos: ReadonlySet<string>): EtapaConocida[] {
  const primeraConDatos = ORDEN_SECUENCIAL.findIndex((e) => etapasConDatos.has(e));
  if (primeraConDatos === -1) return ['final'];
  return ORDEN_SECUENCIAL.slice(primeraConDatos);
}
