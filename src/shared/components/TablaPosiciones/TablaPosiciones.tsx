import React, { useEffect, useMemo, useState } from 'react';
import {
  getTablaFase,
  ordenarFilas,
  estaCalculada,
  type FilaTabla,
} from '../../../features/competencias/services/tablaFaseService';

/**
 * Forma que aceptaba esta tabla antes de consumir `/fases/:id/tabla`. Se mantiene para las
 * pantallas que ya tienen las participaciones cargadas y no quieren un request extra.
 */
export interface ParticipacionFase {
  id: string;
  participacionTemporada: {
    equipo: {
      nombre: string;
    };
  };
  grupo?: string;
  division?: string;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  partidosEmpatados: number;
  diferenciaPuntos: number;
  posicion?: number;
}

interface TablaPosicionesProps {
  faseId?: string;
  participaciones?: ParticipacionFase[];
}

/** Fila normalizada: las dos vías de entrada (fetch y props) terminan acá. */
type Fila = {
  id: string;
  nombre: string;
  grupo: string | null;
  division: string | null;
  posicion: number | null;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  diferenciaPuntos: number;
};

const desdeEndpoint = (f: FilaTabla): Fila => ({
  id: f._id,
  nombre: f.equipo?.nombre || 'Equipo desconocido',
  grupo: f.grupo,
  division: f.division,
  posicion: f.posicion,
  puntos: f.puntos,
  partidosJugados: f.partidosJugados,
  partidosGanados: f.partidosGanados,
  partidosPerdidos: f.partidosPerdidos,
  diferenciaPuntos: f.diferenciaPuntos,
});

const desdeProps = (p: ParticipacionFase): Fila => ({
  id: p.id,
  nombre: p.participacionTemporada?.equipo?.nombre || 'Equipo desconocido',
  grupo: p.grupo ?? null,
  division: p.division ?? null,
  posicion: p.posicion ?? null,
  puntos: p.puntos,
  partidosJugados: p.partidosJugados,
  partidosGanados: p.partidosGanados,
  partidosPerdidos: p.partidosPerdidos,
  diferenciaPuntos: p.diferenciaPuntos,
});

/**
 * Tabla de posiciones de una fase.
 *
 * No calcula nada ni reordena por puntos: el orden lo define `posicion`, que el backend escribe
 * aplicando los criterios de desempate configurados en la fase (`configuracion.criteriosDesempate`).
 * Reordenar acá por puntos —como hacía antes— descartaba silenciosamente esos criterios y podía
 * mostrar un orden distinto al oficial en cuanto dos equipos empataban.
 */
export const TablaPosiciones: React.FC<TablaPosicionesProps> = ({ faseId, participaciones: participacionesProp }) => {
  const [filas, setFilas] = useState<Fila[]>(() =>
    participacionesProp ? participacionesProp.map(desdeProps) : [],
  );
  const [calculada, setCalculada] = useState(() =>
    participacionesProp ? estaCalculada(participacionesProp.map(desdeProps)) : true,
  );
  const [loading, setLoading] = useState(!participacionesProp);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participacionesProp) {
      const normalizadas = participacionesProp.map(desdeProps);
      setFilas(normalizadas);
      setCalculada(estaCalculada(normalizadas));
      setLoading(false);
      return;
    }

    if (!faseId) return;

    let cancelado = false;
    setLoading(true);
    setError(null);

    getTablaFase(faseId)
      .then((data) => {
        if (cancelado) return;
        setFilas(data.posiciones.map(desdeEndpoint));
        setCalculada(data.calculada);
      })
      .catch(() => {
        if (!cancelado) setError('Error al cargar la tabla de posiciones');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [faseId, participacionesProp]);

  /**
   * Las fases con grupos o divisiones son varias tablas, no una sola con una columna extra.
   * Importa además para la numeración: en esas fases `posicion` es relativa al grupo.
   */
  const bloques = useMemo(() => {
    const mapa = new Map<string, Fila[]>();
    for (const fila of filas) {
      const clave = fila.grupo || fila.division || 'general';
      const lista = mapa.get(clave);
      if (lista) lista.push(fila);
      else mapa.set(clave, [fila]);
    }
    return [...mapa.entries()].map(([clave, lista]) => [clave, ordenarFilas(lista)] as const);
  }, [filas]);

  if (loading) return <div>Cargando tabla de posiciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="tabla-posiciones w-full overflow-hidden">
      {!calculada && filas.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <span className="font-bold">Tabla provisoria.</span> Esta fase todavía no fue recalculada por
          la organización, así que el orden sale de puntos y diferencia, y no de los criterios de
          desempate configurados.
        </div>
      )}

      {bloques.map(([clave, lista]) => (
        <div key={clave} className="mb-4 last:mb-0">
          {clave !== 'general' && (
            <h3 className="text-xs font-bold mb-2 text-slate-400 uppercase tracking-widest px-1">
              {`Grupo/División: ${clave}`}
            </h3>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-100 shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 bg-white">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Equipo</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">PJ</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">PG</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">PP</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Dif</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {lista.map((p, index) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 text-[11px] text-slate-400 font-medium text-center">
                      {p.posicion ?? index + 1}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-700 font-semibold truncate max-w-[120px]">
                      {p.nombre}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-600 text-center">{p.partidosJugados}</td>
                    <td className="py-2 px-3 text-[11px] text-emerald-600 text-center hidden sm:table-cell">{p.partidosGanados}</td>
                    <td className="py-2 px-3 text-[11px] text-red-600 text-center hidden sm:table-cell">{p.partidosPerdidos}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-500 text-center hidden md:table-cell">
                      {p.diferenciaPuntos > 0 ? `+${p.diferenciaPuntos}` : p.diferenciaPuntos}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-900 text-center font-bold">{p.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
