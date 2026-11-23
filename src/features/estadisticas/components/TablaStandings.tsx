import { useState, type FC } from 'react';
import type { Partido } from '../../../types';
import { ShareStandingsModal } from './ShareStandingsModal';
import { DataTable } from 'overtime-kit';

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
      <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
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
      {/* Sin defaultSort: `rows` ya viene ordenado por pts, dif, gf. Ordenar por otra columna es
          parte del análisis (¿quién tiene mejor efectividad?), no reemplaza ese orden. */}
      <DataTable
        caption={title}
        data={rows}
        rowKey={(r) => r.equipo}
        empty="No hay partidos finalizados en el filtro actual."
        pageSize={0}
        mobile="scroll"
        columns={[
          { id: 'equipo', header: 'Equipo', sortValue: (r) => r.equipo, cell: (r) => <span className="whitespace-nowrap font-medium text-slate-900">{r.equipo}</span> },
          { id: 'j', header: <abbr title="Jugados" className="no-underline">J</abbr>, align: 'center', sortValue: (r) => r.j, cell: (r) => r.j },
          { id: 'w', header: <abbr title="Ganados" className="no-underline">W</abbr>, align: 'center', sortValue: (r) => r.w, cell: (r) => r.w },
          { id: 'd', header: <abbr title="Empatados" className="no-underline">D</abbr>, align: 'center', sortValue: (r) => r.d, cell: (r) => r.d },
          { id: 'l', header: <abbr title="Perdidos" className="no-underline">L</abbr>, align: 'center', sortValue: (r) => r.l, cell: (r) => r.l },
          { id: 'gf', header: <abbr title="Puntos a favor" className="no-underline">GF</abbr>, align: 'center', sortValue: (r) => r.gf, cell: (r) => r.gf },
          { id: 'gc', header: <abbr title="Puntos en contra" className="no-underline">GC</abbr>, align: 'center', sortValue: (r) => r.gc, cell: (r) => r.gc },
          { id: 'dif', header: <abbr title="Diferencia" className="no-underline">Dif</abbr>, align: 'center', sortValue: (r) => r.dif, cell: (r) => r.dif },
          {
            id: 'pts',
            header: <abbr title="Conteo genérico 3/1/0, no el reglamento de la fase" className="no-underline">Pts</abbr>,
            align: 'center',
            sortValue: (r) => r.pts,
            cell: (r) => <span className="font-semibold">{r.pts}</span>,
          },
          { id: 'ef', header: 'Efect.', align: 'center', sortValue: (r) => r.ef, cell: (r) => `${r.ef}%` },
        ]}
      />

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
