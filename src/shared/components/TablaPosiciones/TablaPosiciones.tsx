import React, { useEffect, useMemo, useState } from 'react';
import {
  getTablaFase,
  ordenarFilas,
  estaCalculada,
  type FilaTabla,
} from '../../../features/competencias/services/tablaFaseService';
import { Escudo } from './Escudo';

/**
 * Forma que aceptaba esta tabla antes de consumir `/fases/:id/tabla`. Se mantiene para las
 * pantallas que ya tienen las participaciones cargadas y no quieren un request extra.
 *
 * `escudo`, `clasificado` y `eliminado` son opcionales: quien ya los tenga cargados los
 * aprovecha (escudo real, fila teñida); quien arme esto a mano sin ellos ve la fila neutra y el
 * círculo con iniciales, en vez de que la tabla invente una señal que nadie confirmó.
 */
export interface ParticipacionFase {
  id: string;
  participacionTemporada: {
    equipo: {
      _id?: string;
      nombre: string;
      escudo?: string | null;
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
  /** Opcionales: el caller que ya los tenga cargados (no todos los que arman esto a mano los
   * traen) los aprovecha para teñir la fila y mostrar el escudo; si no vienen, la fila se ve
   * neutra en vez de asumir un valor que nadie confirmó. */
  clasificado?: boolean;
  eliminado?: boolean;
}

interface TablaPosicionesProps {
  faseId?: string;
  participaciones?: ParticipacionFase[];
  /** id del equipo del usuario, si corresponde: resalta su fila. Aditivo — quien no lo pasa no ve cambios. */
  destacarEquipo?: string;
}

/** Fila normalizada: las dos vías de entrada (fetch y props) terminan acá. */
type Fila = {
  id: string;
  equipoId: string | null;
  nombre: string;
  escudo: string | null;
  grupo: string | null;
  division: string | null;
  posicion: number | null;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  diferenciaPuntos: number;
  clasificado: boolean;
  eliminado: boolean;
};

const desdeEndpoint = (f: FilaTabla): Fila => ({
  id: f._id,
  equipoId: f.equipo?._id ?? null,
  nombre: f.equipo?.nombre || 'Equipo desconocido',
  escudo: f.equipo?.escudo ?? null,
  grupo: f.grupo,
  division: f.division,
  posicion: f.posicion,
  puntos: f.puntos,
  partidosJugados: f.partidosJugados,
  partidosGanados: f.partidosGanados,
  partidosPerdidos: f.partidosPerdidos,
  diferenciaPuntos: f.diferenciaPuntos,
  clasificado: f.clasificado,
  eliminado: f.eliminado,
});

const desdeProps = (p: ParticipacionFase): Fila => ({
  id: p.id,
  equipoId: p.participacionTemporada?.equipo?._id ?? null,
  nombre: p.participacionTemporada?.equipo?.nombre || 'Equipo desconocido',
  escudo: p.participacionTemporada?.equipo?.escudo ?? null,
  grupo: p.grupo ?? null,
  division: p.division ?? null,
  posicion: p.posicion ?? null,
  puntos: p.puntos,
  partidosJugados: p.partidosJugados,
  partidosGanados: p.partidosGanados,
  partidosPerdidos: p.partidosPerdidos,
  diferenciaPuntos: p.diferenciaPuntos,
  clasificado: p.clasificado ?? false,
  eliminado: p.eliminado ?? false,
});

/**
 * Tabla de posiciones de una fase.
 *
 * No calcula nada ni reordena por puntos: el orden lo define `posicion`, que el backend escribe
 * aplicando los criterios de desempate configurados en la fase (`configuracion.criteriosDesempate`).
 * Reordenar acá por puntos —como hacía antes— descartaba silenciosamente esos criterios y podía
 * mostrar un orden distinto al oficial en cuanto dos equipos empataban.
 */
export const TablaPosiciones: React.FC<TablaPosicionesProps> = ({ faseId, participaciones: participacionesProp, destacarEquipo }) => {
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

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Cargando tabla de posiciones">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="tabla-posiciones w-full">
      {!calculada && filas.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-snug text-amber-800">
          <span aria-hidden>⚠</span>
          <span>
            <span className="font-bold">Tabla provisoria.</span> Esta fase todavía no fue recalculada por
            la organización, así que el orden sale de puntos y diferencia, y no de los criterios de
            desempate configurados.
          </span>
        </div>
      )}

      {bloques.map(([clave, lista]) => {
        const hayClasificados = lista.some((f) => f.clasificado);
        const hayEliminados = lista.some((f) => f.eliminado);
        // Última fila clasificada consecutiva desde el principio: ahí va la línea de corte.
        let ultimoClasificadoIdx = -1;
        for (let i = 0; i < lista.length; i++) {
          if (lista[i].clasificado) ultimoClasificadoIdx = i;
          else break;
        }

        return (
          <div key={clave} className="mb-4 last:mb-0 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <b className="text-[13px] font-extrabold text-slate-900">
                {clave === 'general' ? 'Tabla de posiciones' : clave}
              </b>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse bg-white [font-variant-numeric:tabular-nums]">
                <thead>
                  <tr>
                    <th className="w-8 py-1.5 px-2 text-left text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500">#</th>
                    <th className="py-1.5 px-2 text-left text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500">Equipo</th>
                    <th className="py-1.5 px-2 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500">PJ</th>
                    <th className="py-1.5 px-2 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500 hidden sm:table-cell">PG</th>
                    <th className="py-1.5 px-2 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500 hidden sm:table-cell">PP</th>
                    <th className="py-1.5 px-2 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500 hidden md:table-cell">Dif</th>
                    <th className="py-1.5 px-2 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-slate-500">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p, index) => {
                    const esPropio = destacarEquipo && p.equipoId === destacarEquipo;
                    const esCorte = hayClasificados && index === ultimoClasificadoIdx && ultimoClasificadoIdx < lista.length - 1;
                    return (
                      <tr
                        key={p.id}
                        className={[
                          p.clasificado ? 'bg-emerald-50/60' : p.eliminado ? 'bg-red-50/50' : '',
                          esPropio ? 'bg-indigo-50 shadow-[inset_3px_0_0_0_#3b5dff]' : '',
                          esCorte ? 'border-b-2 border-dashed border-emerald-400' : 'border-b border-slate-50 last:border-b-0',
                        ].filter(Boolean).join(' ')}
                      >
                        <td className="py-1.5 px-2 text-[11px] font-bold text-slate-400">
                          {p.posicion ?? index + 1}
                        </td>
                        <td className="py-1.5 px-2 text-[12.5px] font-semibold text-slate-900">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Escudo nombre={p.nombre} semilla={p.equipoId ?? p.id} src={p.escudo} />
                            <span className="truncate max-w-[140px]">{p.nombre}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center text-[12.5px] text-slate-600">{p.partidosJugados}</td>
                        <td className="py-1.5 px-2 text-center text-[12.5px] text-slate-600 hidden sm:table-cell">{p.partidosGanados}</td>
                        <td className="py-1.5 px-2 text-center text-[12.5px] text-slate-600 hidden sm:table-cell">{p.partidosPerdidos}</td>
                        <td className={`py-1.5 px-2 text-center text-[12.5px] hidden md:table-cell ${p.diferenciaPuntos > 0 ? 'text-emerald-600' : p.diferenciaPuntos < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                          {p.diferenciaPuntos > 0 ? `+${p.diferenciaPuntos}` : p.diferenciaPuntos}
                        </td>
                        <td className="py-1.5 px-2 text-center text-[12.5px] font-extrabold text-slate-900">{p.puntos}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(hayClasificados || hayEliminados) && (
              <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[10.5px] text-slate-500">
                {hayClasificados && (
                  <span className="flex items-center gap-1.5">
                    <i className="inline-block h-2 w-2 rounded-sm bg-emerald-200" />
                    Clasifica
                  </span>
                )}
                {hayEliminados && (
                  <span className="flex items-center gap-1.5">
                    <i className="inline-block h-2 w-2 rounded-sm bg-red-200" />
                    Eliminado
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
