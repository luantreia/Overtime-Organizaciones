import type { FC } from 'react';
import type { Partido } from '../../../types';

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
};

export const TablaStandings: FC<Props> = ({ partidos, title = 'Tabla por equipos' }) => {
  const rows = calcStandings(partidos);
  if (rows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p>No hay partidos finalizados para calcular la tabla.</p>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold">{title}</h4>
      </div>
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
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
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
    </div>
  );
};

export default TablaStandings;
