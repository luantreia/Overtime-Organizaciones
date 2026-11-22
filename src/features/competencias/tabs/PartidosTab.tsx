import { useCallback, useEffect, useState } from 'react';
import { getPartidosPorCompetencia, getPartidosPorFase, getPartidosPorTemporada } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
import { useFiltrosURL } from '../../../shared/hooks/useFiltrosURL';
import PartidosSection from '../sections/PartidosSection';
import type { CompetenciaDetalle } from '../hooks/useCompetenciaDetalle';

type Props = {
  competenciaId: string;
  detalle: CompetenciaDetalle;
};

/**
 * Pestaña Partidos. Los filtros viven en la URL (`?tab=partidos&temporada=…&fase=…&estado=…`), con
 * los mismos nombres que ya usa el deep-link de Estructura, así un link a una temporada sirve en
 * las dos pestañas. Los partidos los pide esta pestaña: antes los cargaba la página aunque
 * estuvieras en otra pestaña, y compartían el mismo `loading` con la estructura.
 */
export default function PartidosTab({ competenciaId, detalle }: Props) {
  const filtros = useFiltrosURL<'temporada' | 'fase' | 'estado'>();
  const temporadaId = filtros.get('temporada');
  const faseId = filtros.get('fase');
  const estado = filtros.get('estado');
  const [partidos, setPartidos] = useState<Partido[]>([]);

  const cargar = useCallback(async () => {
    try {
      const lista = faseId
        ? await getPartidosPorFase(faseId)
        : temporadaId
          ? await getPartidosPorTemporada(temporadaId)
          : await getPartidosPorCompetencia(competenciaId);
      setPartidos(lista);
    } catch (error) {
      console.error('Error cargando partidos:', error);
    }
  }, [competenciaId, temporadaId, faseId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <PartidosSection
      partidos={partidos}
      filtroEstado={estado}
      setFiltroEstado={(v) => filtros.set({ estado: v })}
      temporadas={detalle.temporadas}
      fasesPorTemporada={detalle.fasesPorTemporada}
      selectedTemporadaId={temporadaId}
      selectedFaseId={faseId}
      setSelectedTemporadaId={(v) => filtros.set({ temporada: v, fase: null })}
      setSelectedFaseId={(v) => filtros.set({ fase: v })}
      onRefresh={cargar}
    />
  );
}
