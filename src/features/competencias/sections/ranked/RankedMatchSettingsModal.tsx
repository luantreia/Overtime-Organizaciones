import React, { useState, useEffect } from 'react';
import { Button } from '../../../../shared/components/ui';

interface RankedMatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string | null;
  matchConfig?: { 
    matchDuration: number; 
    setDuration: number; 
    useSuddenDeath: boolean;
    autoPauseGlobal?: boolean;
    enableCountdown?: boolean;
    enableWhistle?: boolean;
    whistleType?: 'standard' | 'double' | 'long';
    suddenDeathMessage?: string;
    matchEndMessage?: string;
    enableMatchStartAlert?: boolean;
    matchStartMessage?: string;
    enableLastMinuteAlert?: boolean;
    voiceVolume?: number;
    buzzerVolume?: number;
    voiceRate?: number;
    voiceIndex?: number;
  };
  onUpdateConfig?: (config: any) => Promise<void>;
}

export const RankedMatchSettingsModal: React.FC<RankedMatchSettingsModalProps> = ({
  isOpen,
  onClose,
  matchId,
  matchConfig,
  onUpdateConfig
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [localConfig, setLocalConfig] = useState(matchConfig || { 
    matchDuration: 1200, 
    setDuration: 180, 
    useSuddenDeath: true,
    autoPauseGlobal: false,
    enableCountdown: true,
    enableWhistle: true,
    whistleType: 'double',
    suddenDeathMessage: '¡Muerte Súbita! No hay Escudo!',
    matchEndMessage: 'Tiempo de juego cumplido.',
    enableMatchStartAlert: true,
    matchStartMessage: '¡Partido iniciado! Buena suerte.',
    enableLastMinuteAlert: true,
    voiceVolume: 1,
    buzzerVolume: 0.5,
    voiceRate: 1.3,
    voiceIndex: 0
  });

  useEffect(() => {
    if (matchConfig) {
      setLocalConfig({
        ...matchConfig,
        whistleType: matchConfig.whistleType || 'double',
        suddenDeathMessage: matchConfig.suddenDeathMessage || '¡Muerte Súbita! No hay Escudo!',
        matchEndMessage: matchConfig.matchEndMessage || 'Tiempo de juego cumplido.',
        enableMatchStartAlert: matchConfig.enableMatchStartAlert ?? true,
        matchStartMessage: matchConfig.matchStartMessage || '¡Partido iniciado! Buena suerte.',
        enableLastMinuteAlert: matchConfig.enableLastMinuteAlert ?? true
      });
    }
  }, [matchConfig]);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v.filter(x => x.lang.includes('es')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  if (!isOpen) return null;

  const handleUpdateConfig = async () => {
    if (onUpdateConfig) {
      await onUpdateConfig(localConfig);
      onClose();
    }
  };

  const copyMatchLink = () => {
    if (!matchId) return;
    const url = `${window.location.origin.replace('organizaciones', 'partido')}/control?matchId=${matchId}`;
    navigator.clipboard.writeText(url);
    alert('Link de Mesa de Control copiado al portapapeles');
  };

  const openMatchLink = () => {
    if (!matchId) return;
    const url = `${window.location.origin.replace('organizaciones', 'partido')}/control?matchId=${matchId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Opciones
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-xl">&times;</button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Acciones Rápidas */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Mesa de Control</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button 
                onClick={openMatchLink}
                className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase">Abrir Mesa</span>
              </button>
              <button 
                onClick={copyMatchLink}
                className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase">Copiar Link</span>
              </button>
            </div>
          </div>

          {/* Ajustes de Timer */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Configuración de Tiempos</label>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-slate-600">
                  <span>Partida (Global)</span>
                  <span className="text-emerald-600 font-mono">{Math.floor(localConfig.matchDuration / 60)}:00</span>
                </div>
                <input 
                  type="range" min="60" max="3600" step="60"
                  value={localConfig.matchDuration}
                  onChange={(e) => setLocalConfig({...localConfig, matchDuration: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-slate-600">
                  <span>Tiempo por Set</span>
                  <span className="text-emerald-600 font-mono">
                    {localConfig.setDuration === 0 ? 'INF' : `${Math.floor(localConfig.setDuration / 60)}:${String(localConfig.setDuration % 60).padStart(2, '0')}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   <input 
                    type="range" min="0" max="600" step="30"
                    value={localConfig.setDuration}
                    onChange={(e) => setLocalConfig({...localConfig, setDuration: parseInt(e.target.value)})}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <button 
                    onClick={() => setLocalConfig({...localConfig, setDuration: localConfig.setDuration === 0 ? 180 : 0})}
                    className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${localConfig.setDuration === 0 ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                  >
                     {localConfig.setDuration === 0 ? 'SET' : 'INF'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                 <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[11px] sm:text-xs font-bold text-slate-700">Muerte Súbita</span>
                       <span className="text-[9px] text-slate-400">Desempate al final.</span>
                    </div>
                    <button 
                      onClick={() => setLocalConfig({...localConfig, useSuddenDeath: !localConfig.useSuddenDeath})}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${localConfig.useSuddenDeath ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.useSuddenDeath ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!localConfig.autoPauseGlobal}
                      onChange={(e) => setLocalConfig({...localConfig, autoPauseGlobal: e.target.checked})}
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors shadow-inner" />
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Pausa Global al fin de Set</span>
                </label>
              </div>
            </div>

            {/* Ajustes de Audio */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Alertas y Sonidos</label>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700">Conteo (10s)</span>
                  <button 
                    onClick={() => setLocalConfig({...localConfig, enableCountdown: !localConfig.enableCountdown})}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${localConfig.enableCountdown ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.enableCountdown ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-700">Silbato final</span>
                    <select 
                      value={localConfig.whistleType || 'standard'}
                      onChange={(e) => setLocalConfig({...localConfig, whistleType: e.target.value as any})}
                      className="text-[9px] bg-transparent border-none p-0 font-bold text-emerald-600 focus:ring-0 cursor-pointer"
                    >
                      <option value="standard">Estándar</option>
                      <option value="double">Doble</option>
                      <option value="long">Largo</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setLocalConfig({...localConfig, enableWhistle: !localConfig.enableWhistle})}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${localConfig.enableWhistle ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.enableWhistle ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700">Aviso Inicio de Match</span>
                  <button 
                    onClick={() => setLocalConfig({...localConfig, enableMatchStartAlert: !localConfig.enableMatchStartAlert})}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${localConfig.enableMatchStartAlert ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.enableMatchStartAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700">Aviso Último Minuto (60s)</span>
                  <button 
                    onClick={() => setLocalConfig({...localConfig, enableLastMinuteAlert: !localConfig.enableLastMinuteAlert})}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${localConfig.enableLastMinuteAlert ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localConfig.enableLastMinuteAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {localConfig.enableMatchStartAlert && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Locución Inicio</label>
                      <input 
                        type="text"
                        value={localConfig.matchStartMessage}
                        onChange={(e) => setLocalConfig({...localConfig, matchStartMessage: e.target.value})}
                        className="w-full p-2 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg placeholder:text-slate-300"
                        placeholder="Ej: ¡A jugar!"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Locución Muerte Súbita</label>
                    <input 
                      type="text"
                      value={localConfig.suddenDeathMessage}
                      onChange={(e) => setLocalConfig({...localConfig, suddenDeathMessage: e.target.value})}
                      className="w-full p-2 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg placeholder:text-slate-300"
                      placeholder="Ej: ¡Muerte Súbita activa!"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Locución Fin de Tiempo</label>
                    <input 
                      type="text"
                      value={localConfig.matchEndMessage}
                      onChange={(e) => setLocalConfig({...localConfig, matchEndMessage: e.target.value})}
                      className="w-full p-2 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg placeholder:text-slate-300"
                      placeholder="Ej: Tiempo cumplido."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Voz {Math.round((localConfig.voiceVolume ?? 1) * 100)}%</span>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={localConfig.voiceVolume ?? 1}
                      onChange={(e) => setLocalConfig({...localConfig, voiceVolume: parseFloat(e.target.value)})}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Sonido {Math.round((localConfig.buzzerVolume ?? 0.5) * 100)}%</span>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={localConfig.buzzerVolume ?? 0.5}
                      onChange={(e) => setLocalConfig({...localConfig, buzzerVolume: parseFloat(e.target.value)})}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {voices.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Tipo de Voz</label>
                    <select 
                      value={localConfig.voiceIndex ?? 0}
                      onChange={(e) => setLocalConfig({...localConfig, voiceIndex: parseInt(e.target.value)})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      {voices.map((v, i) => (
                        <option key={i} value={i}>{v.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance("Prueba de sonido");
                        u.lang = 'es-ES';
                        u.rate = localConfig.voiceRate ?? 1.3;
                        u.volume = localConfig.voiceVolume ?? 1;
                        if (voices[localConfig.voiceIndex ?? 0]) u.voice = voices[localConfig.voiceIndex ?? 0];
                        window.speechSynthesis.speak(u);
                      }}
                      className="text-[9px] text-emerald-600 font-bold hover:underline py-1"
                    >
                      Probar sonido...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1 uppercase text-[10px] font-black py-2">Cerrar</Button>
          <Button variant="primary" onClick={handleUpdateConfig} className="flex-1 uppercase text-[10px] font-black py-2">Guardar</Button>
        </div>
      </div>
    </div>
  );
};
