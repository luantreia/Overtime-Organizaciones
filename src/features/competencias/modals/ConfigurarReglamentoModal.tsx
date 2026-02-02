import React, { useState, useEffect } from 'react';
import { BackendFase } from '../services';

interface ReglamentoConfig {
  puntuacion: {
    victoria: number;
    empate: number;
    derrota: number;
    setGanado: number;
    arbitroPresentado: number;
    penalizacionNoArbitro: number;
  };
  criteriosDesempate: string[];
  progresion: {
    clasificanDirecto: number;
    destinoGanadores: string | null;
    destinoPerdedores: string | null;
  };
  playoff: {
    formato: 'simple' | 'doble_eliminacion';
    tercerPuesto: boolean;
    idaYVuelta: boolean;
    rondasConConsolacion?: string[];
  };
}

interface ConfigurarReglamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fase: BackendFase | null;
  todasLasFases: BackendFase[];
  onSave: (faseId: string, configuracion: ReglamentoConfig) => Promise<void>;
}

export default function ConfigurarReglamentoModal({ isOpen, onClose, fase, todasLasFases, onSave }: ConfigurarReglamentoModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ReglamentoConfig>({
    puntuacion: {
      victoria: 3,
      empate: 1,
      derrota: 0,
      setGanado: 0,
      arbitroPresentado: 0,
      penalizacionNoArbitro: 0,
    },
    criteriosDesempate: ['PUNTOS', 'DIF_SETS', 'CARA_A_CARA'],
    progresion: {
      clasificanDirecto: 0,
      destinoGanadores: '',
      destinoPerdedores: '',
    },
    playoff: {
      formato: 'simple',
      tercerPuesto: false,
      idaYVuelta: false,
      rondasConConsolacion: []
    }
  });

  useEffect(() => {
    if (fase?.configuracion) {
      const conf = fase.configuracion;
      setConfig({
        puntuacion: {
           victoria: conf.puntuacion?.victoria ?? 3,
           empate: conf.puntuacion?.empate ?? 1,
           derrota: conf.puntuacion?.derrota ?? 0,
           setGanado: conf.puntuacion?.setGanado ?? 0,
           arbitroPresentado: conf.puntuacion?.arbitroPresentado ?? 0,
           penalizacionNoArbitro: conf.puntuacion?.penalizacionNoArbitro ?? 0,
        },
        criteriosDesempate: conf.criteriosDesempate || ['PUNTOS', 'DIF_SETS', 'CARA_A_CARA'],
        progresion: {
           clasificanDirecto: conf.progresion?.clasificanDirecto ?? 0,
           destinoGanadores: conf.progresion?.destinoGanadores ?? '',
           destinoPerdedores: conf.progresion?.destinoPerdedores ?? '',
        },
        playoff: {
           formato: conf.playoff?.formato ?? 'simple',
           tercerPuesto: conf.playoff?.tercerPuesto ?? false,
           idaYVuelta: conf.playoff?.idaYVuelta ?? false,
           rondasConConsolacion: conf.playoff?.rondasConConsolacion ?? []
        }
      });
    }
  }, [fase]);

  if (!isOpen || !fase) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      // Sanitizar ObjectIds vacíos para que Mongoose no falle al validar strings vacíos como ObjectIds
      const sanitizedConfig = {
        ...config,
        progresion: {
          ...config.progresion,
          destinoGanadores: config.progresion.destinoGanadores || null,
          destinoPerdedores: config.progresion.destinoPerdedores || null,
        }
      };
      await onSave(fase._id, sanitizedConfig);
      onClose();
    } catch (err: any) {
      console.error('Error saving reglamento:', err);
      setError(err.message || 'Error al guardar el reglamento');
    } finally {
      setSaving(false);
    }
  };

  const isTableType = fase.tipo === 'liga' || fase.tipo === 'grupo';
  const isPlayoffType = fase.tipo === 'playoff';

  const moveCriterio = (index: number, direction: 'up' | 'down') => {
    const list = [...config.criteriosDesempate];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setConfig({...config, criteriosDesempate: list});
  };

  const toggleCriterio = (criterio: string) => {
    const current = config.criteriosDesempate || [];
    const next = current.includes(criterio) 
      ? current.filter((c: string) => c !== criterio)
      : [...current, criterio];
    setConfig({...config, criteriosDesempate: next});
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">REGLAMENTO DE FASE</h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                isTableType ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-purple-50 border-purple-200 text-purple-600'
              }`}>
                {fase.tipo}
              </span>
              <p className="text-sm font-bold text-slate-400 italic">{fase.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">✕</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Error de validación</p>
              <p className="text-[11px] font-bold text-rose-500 leading-tight">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
          {isTableType && (
            <>
              {/* SECCIÓN PUNTUACIÓN */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-1">Reglas de Puntuación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500">Victoria</label>
                    <input 
                      type="number" 
                      value={config.puntuacion?.victoria} 
                      onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, victoria: Number(e.target.value)}})}
                      className="w-full rounded-lg border-2 border-slate-100 p-2 font-black text-slate-700 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500">Empate</label>
                    <input 
                      type="number" 
                      value={config.puntuacion?.empate} 
                      onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, empate: Number(e.target.value)}})}
                      className="w-full rounded-lg border-2 border-slate-100 p-2 font-black text-slate-700 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    <div>
                      <label className="text-[9px] font-black uppercase text-brand-500">Set Ganado (+)</label>
                      <input 
                        type="number" 
                        value={config.puntuacion?.setGanado} 
                        onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, setGanado: Number(e.target.value)}})}
                        className="w-full rounded-lg border-2 border-white p-1.5 font-bold text-slate-600 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-blue-500">Árbitro (+) </label>
                      <input 
                        type="number" 
                        value={config.puntuacion?.arbitroPresentado} 
                        onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, arbitroPresentado: Number(e.target.value)}})}
                        className="w-full rounded-lg border-2 border-white p-1.5 font-bold text-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-black uppercase text-rose-500">Penalización No Árbitro (-)</label>
                    <input 
                      type="number" 
                      value={config.puntuacion?.penalizacionNoArbitro} 
                      onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, penalizacionNoArbitro: Number(e.target.value)}})}
                      className="w-full rounded-lg border-2 border-rose-50 p-2 font-bold text-rose-700 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DESEMPATE CON ORDEN */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-1">Prioridad de Desempate</h3>
                <p className="text-[9px] text-slate-400 italic">El primer criterio es el más importante. Arrastra para ordenar.</p>
                <div className="space-y-2">
                  {config.criteriosDesempate.map((c: string, idx: number) => (
                    <div key={c} className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300">#{idx + 1}</span>
                        <span className="text-[11px] font-black text-slate-700">{c.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveCriterio(idx, 'up')} className="p-1 hover:bg-slate-50 rounded text-xs opacity-50 hover:opacity-100">▲</button>
                        <button onClick={() => moveCriterio(idx, 'down')} className="p-1 hover:bg-slate-50 rounded text-xs opacity-50 hover:opacity-100">▼</button>
                        <button onClick={() => toggleCriterio(c)} className="p-1 text-rose-400 hover:text-rose-600 text-xs ml-2">✕</button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Selector para añadir nuevos criterios */}
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleCriterio(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full mt-4 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 p-2 text-[10px] font-black uppercase text-slate-400 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">+ Añadir Criterio</option>
                    {['PUNTOS', 'DIF_SETS', 'SETS_FAVOR', 'PUNTOS_FAVOR', 'DIF_PUNTOS', 'CARA_A_CARA', 'MENOS_TARJETAS']
                      .filter(c => !config.criteriosDesempate.includes(c))
                      .map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* SECCIÓN PROGRESIÓN (Copa Moran Style) */}
              <div className="md:col-span-2 space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">Destino de Equipos (Progresión / Copa de Plata)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {isTableType && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500">¿Cuántos clasifican?</label>
                      <input 
                          type="number" 
                          value={config.progresion?.clasificanDirecto} 
                          onChange={(e) => setConfig({...config, progresion: {...config.progresion, clasificanDirecto: Number(e.target.value)}})}
                          className="w-full rounded-lg border-2 border-white p-2 font-black text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                  )}
                  <div className={isPlayoffType ? "md:col-span-1" : ""}>
                    <label className="text-[10px] font-black uppercase text-green-600">Destino Ganadores</label>
                    <p className="text-[8px] text-slate-400 mb-1 italic">Para campeones o clasificados</p>
                    <select 
                      value={config.progresion?.destinoGanadores}
                      onChange={(e) => setConfig({...config, progresion: {...config.progresion, destinoGanadores: e.target.value}})}
                      className="w-full rounded-lg border-2 border-white p-2 text-xs font-bold text-slate-700 shadow-sm focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Ninguno</option>
                      {todasLasFases.filter(f2 => f2._id !== fase._id).map(f2 => (
                        <option key={f2._id} value={f2._id}>{f2.nombre} ({f2.tipo})</option>
                      ))}
                    </select>
                  </div>
                  <div className={isPlayoffType ? "md:col-span-2" : ""}>
                    <label className="text-[10px] font-black uppercase text-rose-600">Destino Perdedores (Copa de Plata / Repechaje)</label>
                    <p className="text-[8px] text-slate-400 mb-1 italic">¿A dónde van los que quedan eliminados de esta fase?</p>
                    <select 
                      value={config.progresion?.destinoPerdedores}
                      onChange={(e) => setConfig({...config, progresion: {...config.progresion, destinoPerdedores: e.target.value}})}
                      className="w-full rounded-lg border-2 border-white p-2 text-xs font-bold text-slate-700 shadow-sm focus:border-rose-500 focus:outline-none"
                    >
                      <option value="">Ninguno</option>
                      {todasLasFases.filter(f2 => f2._id !== fase._id).map(f2 => (
                        <option key={f2._id} value={f2._id}>{f2.nombre} ({f2.tipo})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {isPlayoffType && (
            <div className="md:col-span-2 space-y-6">
              {/* Para Playoffs, mostramos la progresión arriba también para el caso de perdedores a otra fase */}
              {!isTableType && (
                 <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Flujo de Perdedores</h3>
                    <div>
                      <label className="text-[10px] font-black uppercase text-rose-600">Enviar eliminados a otra fase:</label>
                      <p className="text-[9px] text-slate-400 mb-2 italic">Ej: Perdedores de esta llave pasan a la "Llave de Plata"</p>
                      <select 
                        value={config.progresion?.destinoPerdedores}
                        onChange={(e) => setConfig({...config, progresion: {...config.progresion, destinoPerdedores: e.target.value}})}
                        className="w-full rounded-lg border-2 border-white p-2 text-xs font-bold text-slate-700 shadow-sm focus:border-rose-500 focus:outline-none"
                      >
                        <option value="">Ninguno (Eliminación directa)</option>
                        {todasLasFases.filter(f2 => f2._id !== fase._id).map(f2 => (
                          <option key={f2._id} value={f2._id}>{f2.nombre} ({f2.tipo})</option>
                        ))}
                      </select>
                    </div>

                    {config.progresion?.destinoPerdedores && (
                      <div className="mt-4 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">¿En qué rondas hay revancha (Plata)?</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Treintaidosavos', value: 'treintaidosavos' },
                            { label: 'Dieciseisavos', value: 'dieciseisavos' },
                            { label: 'Octavos', value: 'octavos' },
                            { label: 'Cuartos', value: 'cuartos' },
                            { label: 'Semifinal', value: 'semifinal' },
                            { label: 'Final', value: 'final' }
                          ].map(ronda => (
                            <label key={ronda.value} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-rose-50 transition-colors">
                              <input 
                                type="checkbox"
                                checked={config.playoff?.rondasConConsolacion?.includes(ronda.value)}
                                onChange={(e) => {
                                  const prevRondas = config.playoff?.rondasConConsolacion || [];
                                  const nuevas = e.target.checked 
                                    ? [...prevRondas, ronda.value]
                                    : prevRondas.filter((r: string) => r !== ronda.value);
                                  setConfig({
                                    ...config, 
                                    playoff: {
                                      ...config.playoff, 
                                      rondasConConsolacion: nuevas
                                    }
                                  });
                                }}
                                className="accent-rose-500"
                              />
                              <span className="text-[10px] font-bold text-slate-600">{ronda.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 italic">Solo los perdedores de estas rondas viajarán a la fase de destino.</p>
                      </div>
                    )}
                 </div>
              )}
              <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
                 <h3 className="text-xs font-black uppercase tracking-widest text-purple-900 mb-4 flex items-center gap-2">
                   Mecánicas de Eliminación
                   <span className="bg-purple-200 text-purple-700 text-[8px] px-1.5 py-0.5 rounded-full">INFO</span>
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <div>
                       <label className="text-[10px] font-black uppercase text-purple-500 mb-2 block">Formato del cuadro</label>
                       <select 
                          value={config.playoff.formato} 
                          onChange={(e) => setConfig({...config, playoff: {...config.playoff, formato: e.target.value as 'simple' | 'doble_eliminacion'}})}
                          className="w-full rounded-lg border-2 border-white p-3 font-black text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                        >
                         <option value="simple">Eliminación Simple</option>
                         <option value="doble_eliminacion">Doble Eliminación</option>
                       </select>
                     </div>
                     <div className="p-3 bg-white/50 rounded-xl border border-purple-200">
                        <p className="text-[10px] font-bold text-purple-800 leading-relaxed">
                          {config.playoff?.formato === 'simple' 
                            ? "🚩 Eliminación directa. Se puede configurar que los perdedores de ciertas rondas (ej: Octavos) pasen a otra fase de consolación."
                            : "🔄 Llave de ganadores y perdedores dentro de la misma fase (Double Bracket). Se necesitan dos derrotas para quedar fuera."}
                        </p>
                     </div>
                   </div>

                   <div className="flex flex-col gap-4 py-2">
                     <div className="group relative">
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white border-2 border-transparent hover:border-purple-300 transition-all">
                          <input 
                            type="checkbox" 
                            checked={config.playoff?.tercerPuesto}
                            onChange={(e) => setConfig({...config, playoff: {...config.playoff, tercerPuesto: e.target.checked}})}
                            className="accent-purple-600 w-6 h-6"
                          />
                          <div>
                            <span className="text-xs font-black text-slate-700 block">¿Partido por 3er Puesto?</span>
                            <span className="text-[9px] font-bold text-slate-400">Duelo entre perdedores de semis</span>
                          </div>
                        </label>
                     </div>

                     <div className="group relative">
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white border-2 border-transparent hover:border-purple-300 transition-all">
                          <input 
                            type="checkbox" 
                            checked={config.playoff?.idaYVuelta}
                            onChange={(e) => setConfig({...config, playoff: {...config.playoff, idaYVuelta: e.target.checked}})}
                            className="accent-purple-600 w-6 h-6"
                          />
                          <div>
                            <span className="text-xs font-black text-slate-700 block">¿Ida y Vuelta?</span>
                            <span className="text-[9px] font-bold text-slate-400">Dos partidos por cada cruce</span>
                          </div>
                        </label>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t pt-6">
          <button 
            disabled={saving}
            onClick={onClose} 
            className="px-6 py-2.5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-black text-white shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
          >
            {saving ? 'Guardando...' : 'Guardar Reglamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
