import { useState } from 'react';
import type { Partido } from '../../../types';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import { ModalPartidoAdmin } from '../../partidos/components';
import ModalAlineacionPartido from '../../partidos/components/modals/ModalAlineacionPartido';
import ModalInformacionPartido from '../../partidos/components/modals/ModalInformacionPartido';
import { useToken } from '../../../app/providers/AuthContext';

type Props = {
  partidos: Partido[];
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  onRefresh?: () => void; // Para recargar datos después de cerrar modales si es necesario
};

export default function PartidosSection({ partidos, filtroEstado, setFiltroEstado, onRefresh }: Props) {
  const token = useToken();
  
  // Estados para los modales calcados de PartidosPage
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [partidoAdminId, setPartidoAdminId] = useState<string | null>(null);
  const [alineacionModalAbierto, setAlineacionModalAbierto] = useState(false);
  const [partidoAlineacionId, setPartidoAlineacionId] = useState<string | null>(null);
  const [infoModalAbierto, setInfoModalAbierto] = useState(false);
  const [partidoInfoId, setPartidoInfoId] = useState<string | null>(null);

  const handleSeleccionar = (id: string) => {
    setPartidoAdminId(id);
    setModalAdminAbierto(true);
  };

  const handleAbrirAlineacion = (id: string) => {
    setPartidoAlineacionId(id);
    setAlineacionModalAbierto(true);
  };

  const handleAbrirInformacion = (id: string) => {
    setPartidoInfoId(id);
    setInfoModalAbierto(true);
  };

  const partidosFiltrados = !filtroEstado ? partidos : partidos.filter((p) => p.estado === filtroEstado);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
          <select 
            className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500" 
            value={filtroEstado} 
            onChange={(e)=>setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {partidosFiltrados.length} {partidosFiltrados.length === 1 ? 'Partido' : 'Partidos'}
        </div>
      </div>

      {partidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <p className="text-sm text-slate-500">No hay partidos con estos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partidosFiltrados.map((p) => (
            <PartidoCard
              key={p.id}
              partido={p}
              variante={p.resultado ? 'resultado' : 'proximo'}
              actions={
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAbrirAlineacion(p.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    🏐 Alineación
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAbrirInformacion(p.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    🖊️ Datos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeleccionar(p.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    📊 Stats
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Modales integrados (Igual que en PartidosPage) */}
      {modalAdminAbierto && partidoAdminId && (
        <ModalPartidoAdmin
          partidoId={partidoAdminId}
          token={token ?? ''}
          onClose={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
          }}
          onPartidoEliminado={() => {
            setModalAdminAbierto(false);
            setPartidoAdminId(null);
            onRefresh?.();
          }}
        />
      )}

      <ModalAlineacionPartido
        partidoId={partidoAlineacionId ?? ''}
        isOpen={alineacionModalAbierto && Boolean(partidoAlineacionId)}
        onClose={() => {
          setAlineacionModalAbierto(false);
          setPartidoAlineacionId(null);
        }}
        onSaved={() => {
          setAlineacionModalAbierto(false);
          setPartidoAlineacionId(null);
          onRefresh?.();
        }}
      />

      <ModalInformacionPartido
        partidoId={partidoInfoId}
        isOpen={infoModalAbierto && Boolean(partidoInfoId)}
        onClose={() => {
          setInfoModalAbierto(false);
          setPartidoInfoId(null);
        }}
      />
    </section>
  );
}