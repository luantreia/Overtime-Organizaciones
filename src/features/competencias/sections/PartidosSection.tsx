import { useState } from 'react';
import type { Partido } from '../../../types';
import type { BackendTemporada, BackendFase } from '../services';
import PartidoCard from '../../../shared/components/PartidoCard/PartidoCard';
import { ModalPartidoAdmin } from '../../partidos/components';
import ModalAlineacionPartido from '../../partidos/components/modals/ModalAlineacionPartido';
import ModalInformacionPartido from '../../partidos/components/modals/ModalInformacionPartido';
import ModalBulkEditFechasPartidos from '../../partidos/components/modals/ModalBulkEditFechasPartidos';
import { useToken } from '../../../app/providers/AuthContext';

type Props = {
  partidos: Partido[];
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  temporadas: BackendTemporada[];
  fasesPorTemporada: Record<string, BackendFase[]>;
  selectedTemporadaId: string;
  selectedFaseId: string;
  setSelectedTemporadaId: (v: string) => void;
  setSelectedFaseId: (v: string) => void;
  onRefresh?: () => void; // Para recargar datos después de cerrar modales si es necesario
};

export default function PartidosSection({
  partidos,
  filtroEstado,
  setFiltroEstado,
  temporadas,
  fasesPorTemporada,
  selectedTemporadaId,
  selectedFaseId,
  setSelectedTemporadaId,
  setSelectedFaseId,
  onRefresh,
}: Props) {
  const token = useToken();
  
  // Estados para los modales calcados de PartidosPage
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [partidoAdminId, setPartidoAdminId] = useState<string | null>(null);
  const [alineacionModalAbierto, setAlineacionModalAbierto] = useState(false);
  const [partidoAlineacionId, setPartidoAlineacionId] = useState<string | null>(null);
  const [infoModalAbierto, setInfoModalAbierto] = useState(false);
  const [partidoInfoId, setPartidoInfoId] = useState<string | null>(null);
  const [bulkEditAbierto, setBulkEditAbierto] = useState(false);

  const handleSeleccionar = (id: string) => {
    setPartidoAdminId(id);
    setModalAdminAbierto(true);
  };

  const handleSelectTemporada = (id: string) => {
    setSelectedTemporadaId(id);
    setSelectedFaseId('');
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card">
      <div className="mb-6 space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-medium text-slate-600">
              Temporada
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                value={selectedTemporadaId}
                onChange={(e) => handleSelectTemporada(e.target.value)}
              >
                <option value="">Todas las temporadas</option>
                {temporadas.map((temp) => (
                  <option key={temp._id} value={temp._id}>{temp.nombre || temp._id}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Fase
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                value={selectedFaseId}
                onChange={(e) => setSelectedFaseId(e.target.value)}
                disabled={!selectedTemporadaId}
              >
                <option value="">Todas las fases</option>
                {(fasesPorTemporada[selectedTemporadaId] || []).map((fase) => (
                  <option key={fase._id} value={fase._id}>{fase.nombre || fase._id}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Estado
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBulkEditAbierto(true)}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              📅 Editar fecha de partidos
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
          <span>{partidosFiltrados.length} {partidosFiltrados.length === 1 ? 'Partido' : 'Partidos'}</span>
          {selectedTemporadaId ? (
            <span>{(fasesPorTemporada[selectedTemporadaId] || []).length} fase(s) cargada(s)</span>
          ) : null}
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

      <ModalBulkEditFechasPartidos
        isOpen={bulkEditAbierto}
        partidos={partidosFiltrados}
        onClose={() => setBulkEditAbierto(false)}
        onUpdated={() => {
          setBulkEditAbierto(false);
          onRefresh?.();
        }}
      />
    </section>
  );
}