import { authFetch } from '../../../shared/utils/authFetch';

export interface Sede {
  id: string;
  _id?: string;
  nombre: string;
  direccion?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  canchas?: string[];
  organizacion?: string | null;
}

export class SedeService {
  private static readonly API_ENDPOINT = '/sedes';

  static async getByOrganizacion(organizacionId: string): Promise<Sede[]> {
    const data = await authFetch<any[]>(`${this.API_ENDPOINT}?organizacion=${organizacionId}`);
    return data.map(item => ({ ...item, id: item._id || item.id }));
  }
}
