import { authFetch } from '../../../utils/authFetch';
import type { Jugador, SolicitudJugador, ContratoJugadorResumen, EstadoJugador } from '../../../types';

type GetJugadoresQuery = {
  equipoId: string;
  estado?: EstadoJugador | string;
};

export const getJugadoresEquipo = async (query: GetJugadoresQuery): Promise<Jugador[]> => {
  const params = new URLSearchParams();
  if (query.equipoId) params.set('equipo', query.equipoId);
  if (query.estado) params.set('estado', query.estado);

  const backend = await authFetch<any[]>(`/jugadores?${params.toString()}`);
  return backend.map((b) => ({
    id: b._id ?? b.id,
    nombre: b.nombre ?? b.fullName ?? b.alias ?? 'Jugador',
    posicion: b.posicion ?? b.role ?? '—',
    estado: (b.estado as EstadoJugador) ?? 'activo',
    numeroCamiseta: b.numero ?? b.numeroCamiseta ?? undefined,
    rolEnEquipo: b.rolEnEquipo ?? b.rol ?? undefined,
    fechaInicio: b.fechaInicio ?? undefined,
    fechaFin: b.fechaFin ?? undefined,
    contratoId: b.contratoId ?? undefined,
  }));
};

export const getSolicitudesJugadores = async (equipoId: string): Promise<SolicitudJugador[]> => {
  const params = new URLSearchParams();
  params.set('equipo', equipoId);

  // endpoint name may vary on backend; try a common pattern
  const backend = await authFetch<any[]>(`/jugador-solicitud?${params.toString()}`);
  return backend.map((b) => ({
    id: b._id ?? b.id,
    jugador: {
      id: (b.jugador && (b.jugador._id ?? b.jugador.id)) ?? (b.jugadorId ?? ''),
      nombre: (b.jugador && (b.jugador.nombre ?? b.jugador.fullName)) ?? b.jugadorNombre ?? 'Jugador',
      posicion: b.jugador?.posicion ?? '—',
      estado: b.jugador?.estado ?? 'pendiente',
    } as Jugador,
    estado: (b.estado as 'pendiente' | 'aceptado' | 'rechazado') ?? 'pendiente',
    mensaje: b.mensaje ?? b.note ?? undefined,
    origen: b.origen ?? b.source ?? undefined,
    fechaSolicitud: b.fechaSolicitud ?? b.createdAt ?? undefined,
  }));
};

export const getHistorialSolicitudesJugadorEquipo = async (equipoId: string): Promise<ContratoJugadorResumen[]> => {
  const params = new URLSearchParams();
  params.set('equipo', equipoId);

  const backend = await authFetch<any[]>(`/contratos?${params.toString()}`);
  return backend.map((b) => ({
    id: b._id ?? b.id,
    jugadorNombre: b.jugadorNombre ?? (b.jugador && (b.jugador.nombre ?? b.jugador.fullName)) ?? 'Jugador',
    estado: b.estado ?? 'pendiente',
    rol: b.rol ?? undefined,
    origen: b.origen ?? undefined,
    fechaInicio: b.fechaInicio ?? b.startDate ?? undefined,
    fechaFin: b.fechaFin ?? b.endDate ?? undefined,
    fechaSolicitud: b.fechaSolicitud ?? b.createdAt ?? undefined,
    fechaAceptacion: b.fechaAceptacion ?? b.acceptedAt ?? undefined,
  }));
};

const jugadorEquipoService = {
  getJugadoresEquipo,
  getSolicitudesJugadores,
  getHistorialSolicitudesJugadorEquipo,
};

export default jugadorEquipoService;
