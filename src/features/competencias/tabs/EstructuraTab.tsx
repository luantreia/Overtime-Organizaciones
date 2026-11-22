import { useState } from 'react';
import { Overlay } from 'overtime-kit';
import {
  actualizarFase,
  actualizarTemporada,
  crearFase,
  crearParticipacionFase,
  crearSolicitudParticipacionTemporada,
  crearTemporada,
  eliminarFase,
  eliminarTemporada,
  generarFixture,
  listFasesByTemporada,
  listParticipacionesByFase,
  listParticipacionesByTemporada,
  listTemporadasByCompetencia,
  updateParticipacionTemporada,
  type BackendFase,
  type BackendTemporada,
} from '../services';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import EstructuraSection from '../sections/EstructuraSection';
import ConfirmEliminarTemporadaModal from '../modals/ConfirmEliminarTemporadaModal';
import ConfirmEliminarFaseModal from '../modals/ConfirmEliminarFaseModal';
import type { CompetenciaDetalle } from '../hooks/useCompetenciaDetalle';

type TipoFase = NonNullable<BackendFase['tipo']>;

type Props = {
  competenciaId: string;
  detalle: CompetenciaDetalle;
};

type NuevaFase = {
  nombre: string;
  descripcion?: string;
  tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
  orden?: number;
  fechaInicio?: string;
  fechaFin?: string;
  numeroClasificados?: number;
  faseOrigenA?: string;
  faseOrigenB?: string;
};

/**
 * Pestaña Temporadas/Fases. Dueña de las mutaciones de la estructura y de sus diálogos (eliminar
 * temporada, eliminar fase, editar fase). Los datos son del detalle compartido porque Partidos
 * también los usa para sus filtros; después de cada mutación se refresca sólo la parte tocada.
 */
export default function EstructuraTab({ competenciaId, detalle }: Props) {
  const { addToast } = useToast();
  const {
    datos, organizacionId, esAdmin, loading, recargar,
    temporadas, setTemporadas,
    fasesPorTemporada, setFasesPorTemporada,
    participacionesTemporada, setParticipacionesTemporada,
    participacionesFase, setParticipacionesFase,
  } = detalle;

  const [confirmEliminarTemp, setConfirmEliminarTemp] = useState<BackendTemporada | null>(null);
  const [confirmEliminarFase, setConfirmEliminarFase] = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [editarFase, setEditarFase] = useState<{ fase: BackendFase; temporadaId: string; value: string; tipo: TipoFase | '' } | null>(null);

  const refrescarFases = async (temporadaId: string) => {
    const fases = await listFasesByTemporada(temporadaId);
    setFasesPorTemporada((prev) => ({ ...prev, [temporadaId]: fases }));
  };

  const refrescarTemporadas = async () => {
    setTemporadas(await listTemporadasByCompetencia(competenciaId));
  };

  const onGenerarFixture = async (faseId: string) => {
    await generarFixture(faseId);
    addToast({ type: 'success', title: 'Fixture generado' });
  };

  const onEditarTemporada = async (t: BackendTemporada, payload: { nombre?: string; fechaInicio?: string; fechaFin?: string; estado?: string }) => {
    await actualizarTemporada(t._id, payload as Partial<BackendTemporada>);
    void recargar();
  };

  const onAsignarCampeon = async (temporadaId: string, ganadorId: string | null) => {
    await actualizarTemporada(temporadaId, { ganador: ganadorId } as any);
    addToast({ type: 'success', title: ganadorId ? 'Campeón asignado' : 'Campeón removido' });
    void recargar();
  };

  const onEditarFase = async (fase: BackendFase, temporadaId: string, payload?: Partial<BackendFase>) => {
    if (payload) {
      // Con payload (ej: el reglamento) se guarda directo; sin payload se abre el diálogo de edición.
      await actualizarFase(fase._id, payload);
      await refrescarFases(temporadaId);
      if (payload.configuracion) addToast({ type: 'success', title: 'Reglamento actualizado' });
      return;
    }
    setEditarFase({ fase, temporadaId, value: fase.nombre || 'Fase', tipo: fase.tipo || '' });
  };

  const confirmarEditarFase = async () => {
    if (!editarFase) return;
    const { fase, temporadaId, value, tipo } = editarFase;
    setEditarFase(null);
    const nuevo = value.trim() || fase.nombre;
    if (!nuevo) return;
    const payload: Partial<BackendFase> = { nombre: nuevo };
    if (tipo && tipo !== fase.tipo) payload.tipo = tipo;
    await actualizarFase(fase._id, payload);
    await refrescarFases(temporadaId);
  };

  const crearSolicitudParticipacionTemporadaHandler = async (temporadaId: string, equipoId: string) => {
    if (!temporadaId || !equipoId) return;
    await crearSolicitudParticipacionTemporada(temporadaId, equipoId);
    addToast({ type: 'success', title: 'Solicitud enviada a administradores' });
  };

  const crearParticipacionFaseHandler = async (faseId: string, participacionTemporadaId: string, opts?: { grupo?: string; division?: string }) => {
    if (!faseId || !participacionTemporadaId) return;
    await crearParticipacionFase({ fase: faseId, participacionTemporada: participacionTemporadaId, grupo: opts?.grupo, division: opts?.division });
    const lista = await listParticipacionesByFase(faseId);
    setParticipacionesFase((prev) => ({ ...prev, [faseId]: lista }));
    addToast({ type: 'success', title: 'Participación agregada a la fase' });
  };

  const crearTemporadaHandler = async (payload: { nombre: string; fechaInicio: string; fechaFin?: string }) => {
    await crearTemporada({ competencia: competenciaId, ...payload });
    await refrescarTemporadas();
  };

  const crearFaseHandler = async (temporadaId: string, payload: NuevaFase) => {
    await crearFase({ temporada: temporadaId, ...payload });
    await refrescarFases(temporadaId);
  };

  const updateParticipacionTemporadaHandler = async (id: string, body: Partial<{ estado: string }>) => {
    await updateParticipacionTemporada(id, body);
    const temporadaId = Object.entries(participacionesTemporada)
      .find(([, items]) => (items || []).some((it) => it._id === id))?.[0];
    if (temporadaId) {
      const list = await listParticipacionesByTemporada(temporadaId);
      setParticipacionesTemporada((prev) => ({ ...prev, [temporadaId]: list }));
    }
  };

  return (
    <>
      <EstructuraSection
        esAdmin={esAdmin}
        loading={loading}
        competenciaId={competenciaId}
        competenciaNombre={datos.nombre}
        organizacionId={organizacionId || undefined}
        onRefresh={recargar}
        onSubmitCrearTemporada={crearTemporadaHandler}
        temporadas={temporadas}
        fasesPorTemporada={fasesPorTemporada}
        onSubmitCrearFase={crearFaseHandler}
        onEditarTemporada={onEditarTemporada}
        onAsignarCampeon={onAsignarCampeon}
        onEliminarTemporada={async (t) => setConfirmEliminarTemp(t)}
        onGenerarFixture={onGenerarFixture}
        onEditarFase={onEditarFase}
        onEliminarFase={async (fase, temporadaId) => setConfirmEliminarFase({ fase, temporadaId })}
        participacionesTemporadaPorId={participacionesTemporada}
        participacionesFasePorId={participacionesFase}
        onCrearSolicitudParticipacionTemporada={crearSolicitudParticipacionTemporadaHandler}
        onCrearParticipacionFase={crearParticipacionFaseHandler}
        onUpdateParticipacionTemporada={updateParticipacionTemporadaHandler}
      />

      {confirmEliminarTemp ? (
        <ConfirmEliminarTemporadaModal
          isOpen
          nombre={confirmEliminarTemp.nombre}
          onConfirm={async () => {
            await eliminarTemporada(confirmEliminarTemp._id);
            await refrescarTemporadas();
            setFasesPorTemporada((prev) => {
              const copy = { ...prev };
              delete copy[confirmEliminarTemp._id];
              return copy;
            });
            setConfirmEliminarTemp(null);
            addToast({ type: 'success', title: 'Temporada eliminada' });
          }}
          onCancel={() => setConfirmEliminarTemp(null)}
        />
      ) : null}

      {confirmEliminarFase ? (
        <ConfirmEliminarFaseModal
          isOpen
          nombre={confirmEliminarFase.fase.nombre}
          onConfirm={async () => {
            await eliminarFase(confirmEliminarFase.fase._id);
            await refrescarFases(confirmEliminarFase.temporadaId);
            setConfirmEliminarFase(null);
            addToast({ type: 'success', title: 'Fase eliminada' });
          }}
          onCancel={() => setConfirmEliminarFase(null)}
        />
      ) : null}

      <Overlay
        isOpen={editarFase !== null}
        onClose={() => setEditarFase(null)}
        title="Editar fase"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditarFase(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
            <button type="button" onClick={confirmarEditarFase} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Guardar</button>
          </div>
        }
      >
        {editarFase ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-600">
              Nombre de la fase
              <input
                type="text"
                // eslint-disable-next-line jsx-a11y/no-autofocus -- es el único campo que se viene a editar
                autoFocus
                value={editarFase.value}
                onChange={(e) => setEditarFase({ ...editarFase, value: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') void confirmarEditarFase(); }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-slate-600">
              Tipo
              <select
                value={editarFase.tipo}
                onChange={(e) => setEditarFase({ ...editarFase, tipo: e.target.value as TipoFase | '' })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="grupo">Grupo</option>
                <option value="liga">Liga</option>
                <option value="playoff">Playoff</option>
                <option value="promocion">Promoción</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            {editarFase.tipo && editarFase.tipo !== editarFase.fase.tipo && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Cambiar el tipo no migra las asignaciones existentes: "Grupo" usa el campo <strong>grupo</strong> de cada equipo y "Liga" usa <strong>división</strong>. Si esta fase ya tenía equipos agrupados con el tipo anterior, puede que tengas que reasignarlos.
              </p>
            )}
          </div>
        ) : null}
      </Overlay>
    </>
  );
}
