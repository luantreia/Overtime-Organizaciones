import type { FC } from 'react';
import type { Partido } from '../../../types';

type Props = {
  partidos: Partido[];
  title?: string;
  top?: number;
};

export const TopPartidosDiferencia: FC<Props> = ({ partidos, title = 'Partidos con más diferencia', top = 10 }) => {
  const finalizados = partidos.filter((p) => p.estado === 'finalizado');
  const items = [...finalizados]
    .map((p) => {
      const gf = p.resultado?.puntosEquipo ?? 0; // local
      const gc = p.resultado?.puntosRival ?? 0; // visitante
      const dif = Math.abs(gf - gc);
      return { p, gf, gc, dif };
    })
    .sort((a, b) => b.dif - a.dif)
    .slice(0, top);

  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p>No hay partidos finalizados para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold">{title}</h4>
      </div>
      <ul className="divide-y divide-slate-200">
        {items.map(({ p, gf, gc, dif }) => (
          <li key={p.id} className="py-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {p.localNombre ?? 'Local'} <span className="text-slate-400">vs</span> {p.visitanteNombre ?? 'Visitante'}
              </div>
              <div className="text-xs text-slate-500">
                {(p.fecha ?? '').slice(0, 10)}{p.etapa ? ` • ${p.etapa}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-900">{gf} - {gc}</span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Dif {dif}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopPartidosDiferencia;
