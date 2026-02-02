import React, { useState, useEffect } from 'react';
import { BackendFase } from '../services';

interface ConfigurarReglamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fase: BackendFase | null;
  onSave: (faseId: string, configuracion: any) => Promise<void>;
}

export default function ConfigurarReglamentoModal({ isOpen, onClose, fase, onSave }: ConfigurarReglamentoModalProps) {
  const [config, setConfig] = useState<any>({
    puntuacion: {
      victoria: 3,
      empate: 1,
      derrota: 0,
      setGanado: 0,
    },
    criteriosDesempate: ['PUNTOS', 'DIF_SETS', 'CARA_A_CARA'],
    progresion: {
      clasificanDirecto: 0,
    }
  });

  useEffect(() => {
    if (fase?.configuracion) {
      setConfig(fase.configuracion);
    }
  }, [fase]);

  if (!isOpen || !fase) return null;

  const handleSave = async () => {
    await onSave(fase._id, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">REGLAMENTO DE FASE</h2>
            <p className="text-sm font-bold text-slate-400 italic">{fase.nombre}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
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
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500">Set Ganado (Extra)</label>
                <input 
                  type="number" 
                  value={config.puntuacion?.setGanado} 
                  onChange={(e) => setConfig({...config, puntuacion: {...config.puntuacion, setGanado: Number(e.target.value)}})}
                  className="w-full rounded-lg border-2 border-slate-100 p-2 font-black text-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN DESEMPATE */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-1">Criterios de Desempate</h3>
            <div className="space-y-2">
              {['PUNTOS', 'DIF_SETS', 'CARA_A_CARA', 'DIF_PUNTOS', 'SETS_FAVOR'].map((criterio) => (
                <label key={criterio} className="flex items-center gap-3 p-2 rounded-xl border-2 border-slate-50 hover:border-brand-100 cursor-pointer transition-all">
                  <input 
                    type="checkbox" 
                    checked={config.criteriosDesempate?.includes(criterio)}
                    onChange={(e) => {
                      const current = config.criteriosDesempate || [];
                      const next = e.target.checked ? [...current, criterio] : current.filter((c: string) => c !== criterio);
                      setConfig({...config, criteriosDesempate: next});
                    }}
                    className="accent-brand-600 w-4 h-4"
                  />
                  <span className="text-[11px] font-black text-slate-600">{criterio.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECCIÓN PROGRESIÓN */}
          <div className="md:col-span-2 space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Configuración de Progresión</h3>
             <div className="flex items-center gap-6">
               <div className="flex-1">
                 <label className="text-[10px] font-black uppercase text-slate-500">Equipos que clasifican directamente</label>
                 <p className="text-[9px] text-slate-400 mb-2 italic">Los X primeros de la tabla se marcan como "Clasificados"</p>
                 <input 
                    type="number" 
                    value={config.progresion?.clasificanDirecto} 
                    onChange={(e) => setConfig({...config, progresion: {...config.progresion, clasificanDirecto: Number(e.target.value)}})}
                    className="w-full rounded-lg border-2 border-white p-2 font-black text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                  />
               </div>
               <div className="flex-1">
                 <label className="text-[10px] font-black uppercase text-slate-500">Formato Playoff</label>
                 <select 
                    value={config.playoff?.formato || 'simple'} 
                    onChange={(e) => setConfig({...config, playoff: {...(config.playoff || {}), formato: e.target.value}})}
                    className="w-full rounded-lg border-2 border-white p-2 font-black text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                  >
                   <option value="simple">Eliminación Simple</option>
                   <option value="doble_eliminacion">Doble Eliminación</option>
                 </select>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t pt-6">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
          <button 
            onClick={handleSave}
            className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-black text-white shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] active:translate-y-0 active:shadow-none transition-all"
          >
            Guardar Reglamento
          </button>
        </div>
      </div>
    </div>
  );
}
