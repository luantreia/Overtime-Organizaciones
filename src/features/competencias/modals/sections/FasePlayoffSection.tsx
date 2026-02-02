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

export default function FasePlayoffSection({ 
  participantes, 
  esAdmin, 
  onUpdate, 
  onDelete 
}: { 
  participantes: BackendParticipacionFase[]; 
  esAdmin?: boolean; 
  onUpdate?: (id: string, body: Partial<{ seed: number; posicion: number }>) => void | Promise<void>; 
  onDelete?: (id: string) => void | Promise<void> 
}) {
  const handleRandomizeSeeds = async () => {
    if (!onUpdate) return;
    if (!window.confirm('¿Asignar Seeds aleatorios a todos los participantes?')) return;
    
    const shuffled = [...participantes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      await onUpdate(shuffled[i]._id, { seed: i + 1 });
    }
  };

  const handlePerformanceSeeds = async () => {
    if (!onUpdate) return;
    if (!window.confirm('¿Asignar Seeds basados en el rendimiento (Eficiencia > Dif. Promedio)?')) return;
    
    const sorted = [...participantes].sort((a, b) => {
      // 1. Prioridad por Clasificación (si vienen de una fase donde clasificaron, tienen prioridad)
      if (a.clasificado && !b.clasificado) return -1;
      if (!a.clasificado && b.clasificado) return 1;

      // 2. Eficiencia (Puntos por partido jugado) - Esto nivela a quienes jugaron distinta cantidad de partidos
      const effA = (a.partidosJugados || 0) > 0 ? (a.puntos || 0) / a.partidosJugados! : 0;
      const effB = (b.partidosJugados || 0) > 0 ? (b.puntos || 0) / b.partidosJugados! : 0;
      if (effB !== effA) return effB - effA;
      
      // 3. Diferencia de Puntos promedio por partido
      const diffA = (a.partidosJugados || 0) > 0 ? (a.diferenciaPuntos || 0) / a.partidosJugados! : 0;
      const diffB = (b.partidosJugados || 0) > 0 ? (b.diferenciaPuntos || 0) / b.partidosJugados! : 0;
      return diffB - diffA;
    });

    for (let i = 0; i < sorted.length; i++) {
      await onUpdate(sorted[i]._id, { seed: i + 1 });
    }
  };

  const rows = [...(participantes || [])].sort((a: any, b: any) => {
    const sa = a?.seed ?? Number.POSITIVE_INFINITY;
    const sb = b?.seed ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    const na = ((a?.participacionTemporada as any)?.equipo as any)?.nombre || String(a._id);
    const nb = ((b?.participacionTemporada as any)?.equipo as any)?.nombre || String(b._id);
    return na.localeCompare(nb);
  });

  const seeded = rows.filter((r: any) => typeof r?.seed === 'number');
  const unseeded = rows.filter((r: any) => typeof r?.seed !== 'number');
  const teamName = (pf: BackendParticipacionFase) => {
    const pt: any = (pf as any).participacionTemporada;
    if (!pt) return String(pf._id);
    if (typeof pt === 'string') return pt;
    const eq = pt.equipo;
    if (typeof eq === 'string') return eq;
    return (eq && (eq as any).nombre) || String(pf._id);
  };

  const initialBracket = (() => {
    const base = [...seeded, ...unseeded];
    const n = base.length;
    if (n < 2) return [] as Array<{ a?: string; b?: string }>;
    const size = Math.pow(2, Math.ceil(Math.log2(n)));
    const padded = base.concat(Array.from({ length: size - n }, () => null as any));
    const pairs: Array<{ a?: string; b?: string }> = [];
    let i = 0, j = padded.length - 1;
    while (i < j) {
      const left = padded[i];
      const right = padded[j];
      pairs.push({ a: left ? teamName(left) : 'BYE', b: right ? teamName(right) : 'BYE' });
      i++; j--;
    }
    return pairs;
  })();

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-slate-800">Participantes</h4>
          {esAdmin && participantes.length > 0 && (
            <div className="flex gap-4">
              <button 
                onClick={handleRandomizeSeeds}
                className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 underline decoration-brand-200 underline-offset-4 decoration-2 text-left"
              >
                🎲 Aleatorio
              </button>
              <button 
                onClick={handlePerformanceSeeds}
                className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 underline decoration-brand-200 underline-offset-4 decoration-2 text-left"
              >
                📈 Por Rendimiento
              </button>
            </div>
          )}
        </div>
        <HelpBadge label="Ayuda playoffs">
          <ul className="list-disc pl-4">
            <li>Edite <strong>Seed</strong> para ordenar el emparejamiento inicial.</li>
            <li>Use <strong>Pos</strong> si necesita registrar una posición de cabeza de serie alternativa.</li>
            <li>El botón <strong>Generar llave</strong> crea automáticamente la llave según Seeds (si está conectado en el backend).</li>
            <li>Puede <strong>agregar partidos</strong> manualmente debajo y optar por fijar la <strong>Etapa</strong> (cuartos, semi, final, etc.).</li>
          </ul>
        </HelpBadge>
      </div>
      <table className="mt-2 w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="py-1 pr-2">Equipo</th>
            <th className="py-1 pr-2">Seed</th>
            <th className="py-1 pr-2">Pos</th>
            {esAdmin ? (<th className="py-1 pr-2">Acciones</th>) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((pf) => (
            <tr key={pf._id} className="border-t">
              <td className="py-1 pr-2">{equipoNombreFromPf(pf)}</td>
              <td className="py-1 pr-2">
                {esAdmin ? (
                  <input
                    type="number"
                    className="w-20 rounded border border-slate-200 bg-white px-2 py-1"
                    defaultValue={(pf as any).seed ?? ''}
                    onBlur={(e)=>{ const val = e.currentTarget.value; onUpdate?.(pf._id, { seed: val ? Number(val) : undefined }); }}
                  />
                ) : ((pf as any).seed ?? '-')}
              </td>
              <td className="py-1 pr-2">
                {esAdmin ? (
                  <input
                    type="number"
                    className="w-20 rounded border border-slate-200 bg-white px-2 py-1"
                    defaultValue={(pf as any).posicion ?? ''}
                    onBlur={(e)=>{ const val = e.currentTarget.value; onUpdate?.(pf._id, { posicion: val ? Number(val) : undefined }); }}
                  />
                ) : ((pf as any).posicion ?? '-')}
              </td>
              {esAdmin ? (
                <td className="py-1 pr-2 text-right">
                  <button type="button" className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100" onClick={()=> onDelete?.(pf._id)}>Eliminar</button>
                </td>
              ) : null}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr><td className="py-2 text-slate-400" colSpan={esAdmin ? 4 : 3}>Sin participantes</td></tr>
          ) : null}
        </tbody>
      </table>

      {initialBracket.length > 0 ? (
        <div className="mt-4">
          <h5 className="text-xs font-semibold text-slate-700">Llave (ronda inicial)</h5>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {initialBracket.map((p, idx) => (
              <div key={idx} className="rounded border border-slate-200 bg-white p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{p.a}</span>
                  <span className="text-slate-400">vs</span>
                  <span className="truncate pl-2">{p.b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
