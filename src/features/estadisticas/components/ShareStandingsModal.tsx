import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import ModalBase from '../../../shared/components/ModalBase/ModalBase';

interface StandingsRow {
  equipo: string;
  j: number;
  w: number;
  d: number;
  l: number;
  pts: number;
}

interface ShareStandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: StandingsRow[];
  competenciaNombre: string;
  organizacionNombre?: string;
}

export const ShareStandingsModal: React.FC<ShareStandingsModalProps> = ({
  isOpen,
  onClose,
  rows,
  competenciaNombre,
  organizacionNombre,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const top10 = rows.slice(0, 10);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `overtime-posiciones-${competenciaNombre}`.replace(/\s+/g, '-').toLowerCase() + '.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exportando tabla de posiciones:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Compartir tabla de posiciones" size="md">
      <div className="p-6 flex flex-col items-center">
        <div
          ref={cardRef}
          className="w-[480px] rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-8 flex flex-col text-white"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <div className="text-4xl font-black transform rotate-12">OVERTIME</div>
          </div>

          <div className="mb-6 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70">LoD</div>
            <div className="text-lg font-bold uppercase tracking-wide mt-0.5">{competenciaNombre}</div>
            {organizacionNombre && <div className="text-xs font-semibold opacity-80 mt-0.5">{organizacionNombre}</div>}
            <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Tabla de posiciones · {hoy}</div>
          </div>

          <div className="space-y-2">
            {top10.map((row, i) => (
              <div
                key={row.equipo}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm"
              >
                <div className="w-8 text-lg font-black opacity-80 shrink-0">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{row.equipo}</div>
                  <div className="text-[10px] opacity-70">J {row.j} · G {row.w} · E {row.d} · P {row.l}</div>
                </div>
                <div className="text-lg font-black shrink-0">{row.pts} pts</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/20 flex justify-center">
            <div className="text-lg font-black tracking-tighter">overtime</div>
          </div>
        </div>

        <div className="mt-8 w-full space-y-3">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-brand-600 text-white font-black text-lg hover:bg-brand-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Generando...' : 'Descargar tabla'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
