import { authFetch } from '../../../shared/utils/authFetch';

const BASE = '/api/ranked';

export type Modalidad = 'Foam' | 'Cloth';
export type Categoria = 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';

export async function createRankedMatch(input: { modalidad: Modalidad; categoria: Categoria; fecha?: string; creadoPor?: string; competenciaId?: string; temporadaId?: string; }) {
  return authFetch<{ ok: boolean; partidoId: string }>(`${BASE}/match`, {
    method: 'POST',
    body: input,
  });
}

export async function autoAssign(partidoId: string, players: string[], balanced = true) {
  return authFetch<{ ok: boolean; rojoPlayers: string[]; azulPlayers: string[]; extras: string[] }>(`${BASE}/match/${partidoId}/auto-assign`, {
    method: 'POST',
    body: { players, balanced },
  });
}

export async function assignTeams(partidoId: string, rojoPlayers: string[], azulPlayers: string[]) {
  return authFetch<{ ok: boolean }>(`${BASE}/match/${partidoId}/assign`, {
    method: 'POST',
    body: { rojoPlayers, azulPlayers },
  });
}

export async function finalizeMatch(partidoId: string, marcadorLocal: number, marcadorVisitante: number) {
  return authFetch<{ ok: boolean; rankedMeta?: any; ratingDeltas?: any[] }>(`${BASE}/match/${partidoId}/finalize`, {
    method: 'POST',
    body: { marcadorLocal, marcadorVisitante },
  });
}

export async function getRankedMatch(partidoId: string) {
  return authFetch<{ ok: boolean; partido: any; teams: any[] }>(`${BASE}/match/${partidoId}`);
}

export async function getLeaderboard(params: { modalidad: string; categoria: string; competition?: string; season?: string; minMatches?: number; limit?: number }) {
  const sp = new URLSearchParams({
    modalidad: params.modalidad,
    categoria: params.categoria,
    minMatches: String(params.minMatches ?? 0),
    limit: String(params.limit ?? 50),
  });
  if (params.competition) sp.set('competition', params.competition);
  if (params.season) sp.set('season', params.season);
  return authFetch<{ ok: boolean; items: Array<{ playerId: string; rating: number; matchesPlayed: number; lastDelta?: number }> }>(`${BASE}/leaderboard?${sp.toString()}`);
}

export async function listJugadores(limit = 50) {
  // Simple list for MVP; adjust when adding org scoping
  return authFetch<any[]>(`/api/jugadores?limit=${limit}`, { method: 'GET' });
}

export async function markMatchAsRanked(partidoId: string) {
  return authFetch<{ ok: boolean; rojoPlayers: string[]; azulPlayers: string[] }>(`${BASE}/match/${partidoId}/mark-ranked`, {
    method: 'POST',
  });
}
