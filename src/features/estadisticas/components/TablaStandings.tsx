import { useState, type FC } from 'react';
import type { Partido } from '../../../types';
import { ShareStandingsModal } from './ShareStandingsModal';

type Row = {
  equipo: string;
  j: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
  ef: number;
};

function calcStandings(partidos: Partido[]): Row[] {
  const tabla = new Map<string, Row>();
  const finalizados = partidos.filter((p) => p.estado === 'finalizado');
  for (const p of finalizados) {
    const local = p.localNombre ?? 'Local';
    const visit = p.visitanteNombre ?? 'Visitante';
    const ml = p.resultado?.puntosEquipo ?? 0; // local
    const mv = p.resultado?.puntosRival ?? 0; // visitante
    // Local
    const lrow = tabla.get(local) ?? { equipo: local, j: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, dif: 0, pts: 0, ef: 0 };
    lrow.j += 1; lrow.gf += ml; lrow.gc += mv;
    if (ml > mv) { lrow.w += 1; lrow.pts += 3; }
    else if (ml === mv) { lrow.d += 1; lrow.pts += 1; }
    else { lrow.l += 1; }
    tabla.set(local, lrow);
    // Visitante
    const vrow = tabla.get(visit) ?? { equipo: visit, j: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, dif: 0, pts: 0, ef: 0 };
    vrow.j += 1; vrow.gf += mv; vrow.gc += ml;
    if (mv > ml) { vrow.w += 1; vrow.pts += 3; }
    else if (mv === ml) { vrow.d += 1; vrow.pts += 1; }
    else { vrow.l += 1; }
    tabla.set(visit, vrow);
  }
  const rows = Array.from(tabla.values()).map((r) => ({
    ...r,
    dif: r.gf - r.gc,
    ef: r.j ? Math.round((r.w / r.j) * 100) : 0,
  }));
  rows.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.equipo.localeCompare(b.equipo));
  return rows;
}

type Props = {
  partidos: Partido[];
  title?: string;
  competenciaNombre?: string;
  organizacionNombre?: string;
};

/**
 * Agregado de rendimiento sobre el conjunto de partidos que quedó seleccionado por los filtros
 * de la pantalla de estadísticas.
 *
 * NO es la tabla de posiciones oficial y no puede serlo: acá el filtro es por competencia y por
 * `etapa`, que puede abarcar varias temporadas y varias fases a la vez, así que no hay una fase
 * a la que pedirle `/fases/:id/tabla`. Por eso los puntos se cuentan con un 3/1/0 genérico y no
 * con `fase.configuracion.puntuacion`, y por eso el orden no aplica los criterios de desempate
 * de ninguna fase.
 *
 * Antes esto se titulaba «Tabla por equipos» y mostraba una columna «Pts» sin ninguna aclaración,
 * que es lo que la hacía leerse como la tabla oficial de la competencia. La tabla oficial vive en
 * la estructura de la competencia (`TablaPosiciones`, que consume el endpoint y respeta el
 * reglamento); ésta es una herramienta de análisis y se presenta como tal.
 */
export const TablaStandings: FC<Props> = ({ partidos, title = 'Rendimiento por equipo', competenciaNombre, organizacionNombre }) => {
  const rows = calcStandings(partidos);
  const [isShareOpen, setIsShareOpen] = useState(false);
  if (rows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p>No hay partidos finalizados en el filtro actual.</p>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h4 className="text-lg font-semibold">{title}</h4>
        {competenciaNombre && (
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Compartir tabla
          </button>
        )}
      </div>
      <p className="mb-4 text-xs leading-snug text-slate-500">
        Sobre los partidos finalizados del filtro actual. Los puntos se cuentan con un 3/1/0 genérico,
        no con el reglamento de cada fase: para la tabla oficial, con sus criterios de desempate, mirá
        la fase en la estructura de la competencia.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">J</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">D</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">GF</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">GC</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dif</th>
              <th
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                title="Conteo genérico 3/1/0, no el reglamento de la fase"
              >
                Pts
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Efect.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.equipo} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{r.equipo}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.j}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.w}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.d}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.l}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.gf}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.gc}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.dif}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-semibold">{r.pts}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center">{r.ef}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {competenciaNombre && (
        <ShareStandingsModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          rows={rows}
          competenciaNombre={competenciaNombre}
          organizacionNombre={organizacionNombre}
        />
      )}
    </div>
  );
};

export default TablaStandings;
