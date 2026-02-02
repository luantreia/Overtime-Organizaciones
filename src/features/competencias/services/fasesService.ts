import { authFetch } from '../../../shared/utils/authFetch';

export type BackendFase = {
  _id: string;
  temporada: string;
  nombre?: string;
  descripcion?: string;
  tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
  estado?: 'programada' | 'en_curso' | 'finalizada';
  orden?: number;
  fechaInicio?: string;
  fechaFin?: string;
  configuracion?: {
    puntuacion?: {
      victoria?: number;
      empate?: number;
      derrota?: number;
      setGanado?: number;
      perderPorW?: number;
      arbitroPresentado?: number;
      penalizacionNoArbitro?: number;
    };
    criteriosDesempate?: string[];
    progresion?: {
      clasificanDirecto?: number;
      mejoresAdicionales?: {
        cantidad?: number;
        posicion?: number;
        criterio?: 'global' | 'por_grupo';
      };
      destinoGanadores?: string | null;
      destinoPerdedores?: string | null;
    };
    playoff?: {
      formato?: 'simple' | 'doble_eliminacion';
      idaYVuelta?: boolean;
      tercerPuesto?: boolean;
      rondasConConsolacion?: string[];
    };
  };
};

export async function listFasesByTemporada(temporadaId: string): Promise<BackendFase[]> {
  const params = new URLSearchParams();
  params.set('temporada', temporadaId);
  return authFetch<BackendFase[]>(`/fases?${params.toString()}`);
}

export async function crearFase(payload: {
  temporada: string;
  nombre: string;
  descripcion?: string;
  tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
  orden?: number;
  fechaInicio?: string;
  fechaFin?: string;
  numeroClasificados?: number;
  faseOrigenA?: string;
  faseOrigenB?: string;
}) {
  return authFetch<BackendFase>('/fases', { method: 'POST', body: payload });
}

export async function actualizarFase(id: string, body: Partial<BackendFase>) {
  return authFetch<BackendFase>(`/fases/${id}`, { method: 'PUT', body });
}

export async function eliminarFase(id: string) {
  return authFetch<{ mensaje: string }>(`/fases/${id}`, { method: 'DELETE' });
}

export async function generarFixture(faseId: string) {
  return authFetch<{ mensaje: string; cantidad?: number }>(`/fases/${faseId}/generar-fixture`, { method: 'POST' });
}

export async function getFaseById(id: string): Promise<BackendFase> {
  return authFetch<BackendFase>(`/fases/${id}`);
}
