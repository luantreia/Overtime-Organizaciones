import type { EtapaConocida } from './derivarRondas';

/**
 * Sugiere una corrección de `etapa` reconstruyendo la estructura real de la llave a partir de
 * quién le ganó a quién y cuándo — sin confiar en la etiqueta que el organizador tipeó al
 * cargar el partido a mano.
 *
 * Por qué hace falta: `derivarRondas` (la que dibuja la llave) agrupa por `etapa` a propósito
 * —es un dato real del modelo, y confiar en él es lo correcto una vez que está bien cargado—
 * pero cuando alguien arma los partidos de un playoff con `ModalCrearPartidoAmistoso` (que no
 * tiene ningún selector de etapa) o elige mal la opción, `etapa` queda en `'otro'` o en la
 * etapa equivocada. `derivarRondas` no tiene forma de saberlo: agrupa fielmente un dato que
 * está mal. Esto reconstruye la verdad por otro camino —el avance real de los equipos— y la
 * compara contra lo cargado.
 *
 * LA IDEA: en una llave de eliminación directa, un equipo que gana avanza a jugar de nuevo más
 * adelante. Si se ordenan los partidos de un equipo por fecha, cada partido nuevo es "una ronda
 * más" que el anterior — sin importar cómo se haya llamado esa ronda. Agrupando así se
 * reconstruye la ronda real de cada partido, comparable después contra la etiqueta guardada.
 */

export interface PartidoParaSugerencia {
  id: string;
  fecha: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  marcadorLocal: number;
  marcadorVisitante: number;
  etapaActual: string | null;
}

export interface SugerenciaEtapa {
  partidoId: string;
  etapaActual: string | null;
  /** 'otro' sólo aparece si la llave tiene más olas que nombres conocidos (torneo enorme, caso
   * de borde real pero improbable) — ahí no hay un nombre mejor que ofrecer. */
  etapaSugerida: EtapaConocida | 'tercer_puesto' | 'otro';
  /**
   * `false` cuando la reconstrucción no tuvo una señal decisiva para desempatar (dos partidos
   * del mismo equipo el mismo día, donde ninguno de los dos rivales vuelve a aparecer más
   * adelante). En ese caso la sugerencia existe pero conviene mostrarla con menos confianza,
   * no como un hecho.
   */
  confiable: boolean;
  difiere: boolean;
}

const ORDEN_SECUENCIAL: EtapaConocida[] = [
  'treintaidosavos',
  'dieciseisavos',
  'octavos',
  'cuartos',
  'semifinal',
  'final',
];

type PartidoInterno = PartidoParaSugerencia & { ola: number; esConsolacion: boolean; confiable: boolean };

/**
 * Reconstruye, partido por partido, en qué "ola" de la llave cae cada uno — 1 la primera ronda
 * jugada, 2 la siguiente, etc. — a partir de cuántas veces ganó cada equipo antes en la carrera
 * principal. Ningún nombre de etapa entra en este cálculo: sólo fechas, equipos y marcadores.
 */
function calcularOlas(partidos: PartidoParaSugerencia[]): PartidoInterno[] {
  const porFecha = new Map<string, PartidoParaSugerencia[]>();
  for (const p of partidos) {
    const lista = porFecha.get(p.fecha);
    if (lista) lista.push(p);
    else porFecha.set(p.fecha, [p]);
  }
  const fechas = [...porFecha.keys()].sort();

  // Señal para desempatar dos partidos del mismo equipo en la MISMA fecha: si el rival de un
  // partido vuelve a aparecer en una fecha posterior, entró como "bye" directo a esa ronda —
  // no es el partido más temprano de los dos. Sin esto, "PCH venció a Moran" y "PCH perdió con
  // Panthers" (mismo día) no tienen forma de saber cuál fue antes.
  const ultimaAparicion = new Map<string, string>();
  for (const p of partidos) {
    for (const eq of [p.equipoLocalId, p.equipoVisitanteId]) {
      const previa = ultimaAparicion.get(eq);
      if (!previa || previa < p.fecha) ultimaAparicion.set(eq, p.fecha);
    }
  }

  const rondaGanadaPrincipal = new Map<string, number>();
  const eliminadoPrincipal = new Set<string>();
  const resultado: PartidoInterno[] = [];
  // Equipos cuya ronda actual viene de una resolución incierta (el desempate por reaparición
  // futura no alcanzó). Si el PRÓXIMO partido de ese equipo se apoya en ese número para ubicarse,
  // hereda la incertidumbre — la sugerencia para ese partido tampoco es un hecho, aunque su
  // propio desempate haya sido, en aislamiento, inequívoco.
  const rondaIncierta = new Set<string>();

  const resolverUno = (p: PartidoParaSugerencia, confiableEnAislamiento: boolean) => {
    const rA = rondaGanadaPrincipal.get(p.equipoLocalId) ?? 0;
    const rB = rondaGanadaPrincipal.get(p.equipoVisitanteId) ?? 0;
    const heredaIncertidumbre = rondaIncierta.has(p.equipoLocalId) || rondaIncierta.has(p.equipoVisitanteId);
    const confiable = confiableEnAislamiento && !heredaIncertidumbre;
    const esConsolacion = eliminadoPrincipal.has(p.equipoLocalId) || eliminadoPrincipal.has(p.equipoVisitanteId);
    const ola = Math.max(rA, rB) + 1;
    const gano = p.marcadorLocal > p.marcadorVisitante;
    const ganador = gano ? p.equipoLocalId : p.equipoVisitanteId;
    const perdedor = gano ? p.equipoVisitanteId : p.equipoLocalId;
    rondaGanadaPrincipal.set(ganador, Math.max(rondaGanadaPrincipal.get(ganador) ?? 0, ola));
    rondaGanadaPrincipal.set(perdedor, Math.max(rondaGanadaPrincipal.get(perdedor) ?? 0, ola));
    if (!confiable) {
      rondaIncierta.add(ganador);
      rondaIncierta.add(perdedor);
    }
    if (!esConsolacion) eliminadoPrincipal.add(perdedor);
    resultado.push({ ...p, ola, esConsolacion, confiable });
  };

  for (const fecha of fechas) {
    let pendientes = porFecha.get(fecha)!;
    while (pendientes.length > 0) {
      const resolublesAhora: PartidoParaSugerencia[] = [];
      const siguientes: PartidoParaSugerencia[] = [];
      for (const p of pendientes) {
        const otros = pendientes.filter((q) => q.id !== p.id);
        const depende = otros.some(
          (q) =>
            q.equipoLocalId === p.equipoLocalId ||
            q.equipoVisitanteId === p.equipoLocalId ||
            q.equipoLocalId === p.equipoVisitanteId ||
            q.equipoVisitanteId === p.equipoVisitanteId,
        );
        (depende ? siguientes : resolublesAhora).push(p);
      }
      if (resolublesAhora.length > 0) {
        for (const p of resolublesAhora) resolverUno(p, true);
        pendientes = siguientes;
        continue;
      }
      // Empate real dentro de la fecha: usar la señal de reaparición futura.
      let elegido: PartidoParaSugerencia | null = null;
      let confiable = true;
      for (const p of pendientes) {
        const rivalReapareceDespues =
          (ultimaAparicion.get(p.equipoLocalId) ?? '') > fecha || (ultimaAparicion.get(p.equipoVisitanteId) ?? '') > fecha;
        if (!rivalReapareceDespues) {
          elegido = p;
          break;
        }
      }
      if (!elegido) {
        // Ninguna de las dos señales alcanza: ninguno de los dos equipos vuelve a jugar. No
        // hay forma de saber cuál partido fue antes con los datos que hay — se resuelve en el
        // orden en que llegaron y se marca como no confiable.
        elegido = pendientes[0];
        confiable = false;
      }
      resolverUno(elegido, confiable);
      pendientes = pendientes.filter((p) => p.id !== elegido!.id);
    }
  }
  return resultado;
}

// De atrás para adelante: la última ola jugada es la final, la anterior la semifinal, etc.
// Es el mismo orden que `ORDEN_SECUENCIAL` pero invertido.
const NOMBRE_DESDE_LA_FINAL = [...ORDEN_SECUENCIAL].reverse();

export function sugerirEtapas(partidos: PartidoParaSugerencia[]): SugerenciaEtapa[] {
  const conOlas = calcularOlas(partidos);
  const olasPrincipales = [...new Set(conOlas.filter((r) => !r.esConsolacion).map((r) => r.ola))].sort((a, b) => a - b);
  const totalOlas = olasPrincipales.length;

  return conOlas.map((r) => {
    // `distanciaDeLaFinal`: 0 para la última ola jugada (la final), 1 para la anterior
    // (semifinal), y así hacia atrás.
    const distanciaDeLaFinal = totalOlas - r.ola;
    const etapaSugerida: EtapaConocida | 'tercer_puesto' | 'otro' = r.esConsolacion
      ? 'tercer_puesto'
      : (NOMBRE_DESDE_LA_FINAL[distanciaDeLaFinal] ?? 'otro');
    return {
      partidoId: r.id,
      etapaActual: r.etapaActual,
      etapaSugerida,
      confiable: r.confiable,
      difiere: r.etapaActual !== etapaSugerida,
    };
  });
}
