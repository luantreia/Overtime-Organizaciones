import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnlacePartido } from './derivarRondas';

export interface Conector {
  id: string;
  /** 'local' o 'visitante': de qué lado del partido hijo entra esta línea, para poder resaltar
   * distinto (por ejemplo) el lado que efectivamente ganó. */
  lado: 'local' | 'visitante';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const firmaDe = (conectores: Conector[]): string =>
  conectores.map((c) => `${c.id}:${c.x1}:${c.y1}:${c.x2}:${c.y2}`).join('|');

/**
 * Dibuja las líneas de una llave MIDIENDO las tarjetas ya puestas en pantalla, en vez de calcular
 * a mano la posición de cada una.
 *
 * Por qué así: una llave con byes (equipos que entran directo a cuartos sin jugar clasificación
 * — el caso real de esta liga, visto dos temporadas seguidas) no tiene un layout parejo de
 * "la mitad de partidos en cada ronda". Calcular la posición vertical exacta de cada tarjeta a
 * mano requeriría resolver el mismo problema que ya resuelve el navegador solo con
 * `justify-around` en cada columna. En vez de duplicar ese cálculo, se deja que cada columna se
 * acomode como ya lo hace, se mide dónde quedó cada tarjeta después de pintarse, y se dibujan
 * las líneas encima con SVG uniendo los puntos reales.
 */
export function useConectoresLlave(enlaces: Map<string, EnlacePartido>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tarjetasRef = useRef<Map<string, HTMLElement>>(new Map());
  const [conectores, setConectores] = useState<Conector[]>([]);
  // Firma del último cálculo aplicado. Comparar contra esto —no sólo llamar `setConectores`
  // directo— es lo que evita el loop: el ResizeObserver dispara `recalcular` varias veces
  // mientras el layout se asienta, y sin este chequeo cada llamada crea un array nuevo (aunque
  // los valores sean idénticos), React re-renderiza, el efecto se reevalúa, y no corta nunca.
  const ultimaFirma = useRef('');

  const registrarTarjeta = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) tarjetasRef.current.set(id, el);
      else tarjetasRef.current.delete(id);
    },
    [],
  );

  const recalcular = useCallback(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const contRect = cont.getBoundingClientRect();
    const nuevos: Conector[] = [];

    for (const [hijoId, { padreLocalId, padreVisitanteId }] of enlaces) {
      const hijoEl = tarjetasRef.current.get(hijoId);
      if (!hijoEl) continue;
      const hijoRect = hijoEl.getBoundingClientRect();
      const xHijo = Math.round(hijoRect.left - contRect.left);
      const yHijo = Math.round(hijoRect.top - contRect.top + hijoRect.height / 2);

      for (const [lado, padreId] of [
        ['local', padreLocalId],
        ['visitante', padreVisitanteId],
      ] as const) {
        if (!padreId) continue;
        const padreEl = tarjetasRef.current.get(padreId);
        if (!padreEl) continue;
        const padreRect = padreEl.getBoundingClientRect();
        nuevos.push({
          id: `${hijoId}-${lado}`,
          lado,
          x1: Math.round(padreRect.right - contRect.left),
          y1: Math.round(padreRect.top - contRect.top + padreRect.height / 2),
          x2: xHijo,
          y2: yHijo,
        });
      }
    }

    const firma = firmaDe(nuevos);
    if (firma === ultimaFirma.current) return; // nada cambió de verdad: no dispares otro render
    ultimaFirma.current = firma;
    setConectores(nuevos);
  }, [enlaces]);

  useEffect(() => {
    recalcular();
    const cont = containerRef.current;
    if (!cont || typeof ResizeObserver === 'undefined') return;
    // Los partidos entran con `justify-around` dentro de su columna: el alto real de cada
    // tarjeta (si el marcador ocupa una o dos líneas, si hay badge de "en vivo", etc.) mueve a
    // todas las de abajo. Este observer recalcula apenas el layout se asienta, sin depender de
    // adivinar cuándo terminó de pintar — el chequeo de firma de arriba evita que dispare
    // renders de más mientras tanto.
    const obs = new ResizeObserver(() => recalcular());
    obs.observe(cont);
    window.addEventListener('resize', recalcular);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', recalcular);
    };
  }, [recalcular]);

  return { containerRef, registrarTarjeta, conectores };
}
