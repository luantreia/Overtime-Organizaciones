import type { Partido } from '../../../types';

type Props = {
  partidos: Partido[];
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
};

export default function PartidosSection({ partidos, filtroEstado, setFiltroEstado }: Props) {
  const partidosFiltrados = !filtroEstado ? partidos : partidos.filter((p) => p.estado === filtroEstado);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
          <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={filtroEstado} onChange={(e)=>setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      {partidosFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">No hay partidos.</p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {partidosFiltrados.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{p.rival}</p>
                <p className="text-xs text-slate-500">{p.fecha} {p.hora ? `· ${p.hora}` : ''}</p>
              </div>
              <span className="text-xs capitalize text-slate-500">{p.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
