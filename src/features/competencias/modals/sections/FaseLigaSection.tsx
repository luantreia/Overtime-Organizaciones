import type { BackendParticipacionFase } from '../../services';
import HelpBadge from '../../../../shared/components/HelpBadge/HelpBadge';

function equipoNombreFromPf(pf: BackendParticipacionFase): string {
  const pt: any = (pf as any).participacionTemporada;
  if (!pt) return pf._id;
  if (typeof pt === 'string') return pt;
  const eq = pt.equipo;
  if (typeof eq === 'string') return eq;
  return (eq && (eq as any).nombre) || pf._id;
}

export default function FaseLigaSection({ participantes, esAdmin, onUpdate, onDelete }: { participantes: BackendParticipacionFase[]; esAdmin?: boolean; onUpdate?: (id: string, body: Partial<{ division: string }>) => void | Promise<void>; onDelete?: (id: string) => void | Promise<void> }) {
  const divisiones = Array.from(new Set<string>((participantes || []).map((p: any) => p?.division || '')));

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-medium text-slate-800">Divisiones</h4>
        <HelpBadge label="Ayuda liga">
          <ul className="list-disc pl-4">
            <li>Las tablas están ordenadas por <strong>Puntos</strong> y luego <strong>Diferencia</strong>.</li>
            <li>Puede mover equipos entre <strong>Divisiones</strong> desde el selector de cada fila.</li>
            <li>Use <strong>Eliminar</strong> para quitar la participación de la fase (no borra el equipo).</li>
          </ul>
        </HelpBadge>
      </div>
      {(divisiones.length ? divisiones : ['']).map((div) => {
        const allDivs = divisiones.filter(Boolean);
        const rows = (participantes || [])
          .filter((pf: any) => (pf?.division || '') === div)
          .sort((a: any, b: any) => {
            const pa = a?.puntos ?? 0; const pb = b?.puntos ?? 0;
            if (pb !== pa) return pb - pa;
            const da = a?.diferenciaPuntos ?? 0; const db = b?.diferenciaPuntos ?? 0;
            return db - da;
          });
        return (
        <div key={div} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">División {div || '—'}</p>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 pr-2">Equipo</th>
                <th className="py-1 pr-2">División</th>
                <th className="py-1 pr-2">PJ</th>
                <th className="py-1 pr-2">PG</th>
                <th className="py-1 pr-2">PP</th>
                <th className="py-1 pr-2">PE</th>
                <th className="py-1 pr-2">Pts</th>
                <th className="py-1 pr-2">Dif</th>
                {esAdmin ? (<th className="py-1 pr-2">Acciones</th>) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((pf: any) => (
                <tr key={pf._id} className="border-t">
                  <td className="py-1 pr-2">{equipoNombreFromPf(pf)}</td>
                  <td className="py-1 pr-2">
                    {esAdmin ? (
                      <select className="rounded border border-slate-200 bg-white px-2 py-1" defaultValue={pf?.division || ''} onChange={(e)=>{ onUpdate?.(pf._id, { division: e.target.value || undefined }); }}>
                        <option value="">—</option>
                        {allDivs.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    ) : (pf?.division || '—')}
                  </td>
                  <td className="py-1 pr-2">{(pf as any).partidosJugados ?? 0}</td>
                  <td className="py-1 pr-2">{(pf as any).partidosGanados ?? 0}</td>
                  <td className="py-1 pr-2">{(pf as any).partidosPerdidos ?? 0}</td>
                  <td className="py-1 pr-2">{(pf as any).partidosEmpatados ?? 0}</td>
                  <td className="py-1 pr-2">{(pf as any).puntos ?? 0}</td>
                  <td className="py-1 pr-2">{(pf as any).diferenciaPuntos ?? 0}</td>
                  {esAdmin ? (
                    <td className="py-1 pr-2 text-right">
                      <button type="button" className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100" onClick={()=> onDelete?.(pf._id)}>Eliminar</button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr><td className="py-2 text-slate-400" colSpan={esAdmin ? 8 : 7}>Sin equipos</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        );
      })}
    </div>
  );
}
