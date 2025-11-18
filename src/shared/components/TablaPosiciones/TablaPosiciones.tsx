import React, { useEffect, useState } from 'react';
import { authFetch } from '../../../utils/authFetch';

interface ParticipacionFase {
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

export const TablaPosiciones: React.FC<TablaPosicionesProps> = ({ faseId, participaciones: participacionesProp }) => {
  const [participaciones, setParticipaciones] = useState<ParticipacionFase[]>(participacionesProp || []);
  const [loading, setLoading] = useState(!participacionesProp);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participacionesProp) {
      setParticipaciones(participacionesProp);
      setLoading(false);
      return;
    }

    const fetchParticipaciones = async () => {
      if (!faseId) return;
      try {
        const params = new URLSearchParams({ fase: faseId });
        const data = await authFetch<ParticipacionFase[]>(`/participacion-fase?${params.toString()}`, {
          useAuth: false, // Asumiendo que es público
        });
        setParticipaciones(data);
      } catch (err) {
        setError('Error al cargar la tabla de posiciones');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipaciones();
  }, [faseId, participacionesProp]);

  if (loading) return <div>Cargando tabla de posiciones...</div>;
  if (error) return <div>{error}</div>;

  // Agrupar por grupo o división
  const agrupados: { [key: string]: ParticipacionFase[] } = {};
  participaciones.forEach((p) => {
    const key = p.grupo || p.division || 'general';
    if (!agrupados[key]) agrupados[key] = [];
    agrupados[key].push(p);
  });

  // Ordenar cada grupo por puntos descendente
  Object.keys(agrupados).forEach((key) => {
    agrupados[key].sort((a, b) => b.puntos - a.puntos);
  });

  return (
    <div className="tabla-posiciones">
      {Object.entries(agrupados).map(([key, lista]) => (
        <div key={key} className="mb-8">
          <h3 className="text-lg font-bold mb-4">
            {key === 'general' ? 'Tabla General' : `Grupo/División: ${key}`}
          </h3>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Pos</th>
                <th className="py-2 px-4 border">Equipo</th>
                <th className="py-2 px-4 border">PJ</th>
                <th className="py-2 px-4 border">PG</th>
                <th className="py-2 px-4 border">PP</th>
                <th className="py-2 px-4 border">PE</th>
                <th className="py-2 px-4 border">Dif</th>
                <th className="py-2 px-4 border">Pts</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border text-center">{index + 1}</td>
                  <td className="py-2 px-4 border">
                    {p.participacionTemporada?.equipo?.nombre || 'Equipo desconocido'}
                  </td>
                  <td className="py-2 px-4 border text-center">{p.partidosJugados}</td>
                  <td className="py-2 px-4 border text-center">{p.partidosGanados}</td>
                  <td className="py-2 px-4 border text-center">{p.partidosPerdidos}</td>
                  <td className="py-2 px-4 border text-center">{p.partidosEmpatados}</td>
                  <td className="py-2 px-4 border text-center">{p.diferenciaPuntos}</td>
                  <td className="py-2 px-4 border text-center font-bold">{p.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};