import { useCallback, useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../../shared/components/ModalBase/ModalBase';
import {
  getPartidoDetallado,
  recalcularMarcadorPartido,
  editarPartido,
  extractEquipoId,
  type PartidoDetallado,
} from '../../services/partidoService';
import type { Competencia } from '../../../../types';
import { getParticipaciones as getCompetencias } from '../../../competencias/services/equipoCompetenciaService';
import { useToast } from '../../../../shared/components/Toast/ToastProvider';

interface ModalInformacionPartidoProps {
  partidoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ModalInformacionPartido = ({ partidoId, isOpen, onClose }: ModalInformacionPartidoProps) => {
  const { addToast } = useToast();
  const [partido, setPartido] = useState<PartidoDetallado | null>(null);
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState<{
    fecha: string;
    ubicacion: string;
    estado: string;
    nombrePartido: string;
    marcadorLocal: number;
    marcadorVisitante: number;
    marcadorModificadoManualmente: boolean;
    modalidad: string;
    categoria: string;
    competencia: string;
    etapa?: string;
    grupo?: string;
    division?: string;
  } | null>(null);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);

  const equipoContextoId = useMemo(() => {
    if (!partido) return undefined;
    return extractEquipoId(partido.equipoLocal) ?? extractEquipoId(partido.equipoVisitante);
  }, [partido]);

  const cargar = useCallback(async () => {
    if (!isOpen || !partidoId) {
      setPartido(null);
      setDatosEdicion(null);
      return;
    }
    try {
      setLoading(true);
      const detalle = await getPartidoDetallado(partidoId);
      setPartido(detalle);
      setDatosEdicion({
        fecha: detalle.fecha ? new Date(detalle.fecha).toISOString().slice(0, 16) : '',
        ubicacion: detalle.ubicacion || '',
        estado: detalle.estado || 'programado',
        nombrePartido: detalle.nombrePartido || '',
        marcadorLocal: detalle.marcadorLocal || 0,
        marcadorVisitante: detalle.marcadorVisitante || 0,
        marcadorModificadoManualmente: detalle.marcadorModificadoManualmente || false,
        modalidad: detalle.modalidad || '',
        categoria: detalle.categoria || '',
        competencia:
          typeof detalle.competencia === 'string'
            ? detalle.competencia
            : (detalle.competencia as { _id?: string } | undefined)?._id || '',
        etapa: (detalle as any).etapa || '',
        grupo: (detalle as any).grupo || '',
        division: (detalle as any).division || '',
      });
    } catch (err) {
      console.error('Error al cargar información del partido:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos obtener los datos del partido.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, isOpen, partidoId]);

  const cargarCompetencias = useCallback(async () => {
    try {
      if (!equipoContextoId) {
        setCompetencias([]);
        return;
      }
      const participaciones = await getCompetencias({ equipoId: equipoContextoId });
      const comps = Array.isArray(participaciones)
        ? participaciones.map((p) => p.competencia).filter((c): c is Competencia => Boolean(c?.id))
        : [];
      setCompetencias(comps);
    } catch (err) {
      console.error('Error al cargar competencias:', err);
    }
  }, [equipoContextoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarCompetencias();
  }, [cargarCompetencias]);

  const handleGuardar = async () => {
    if (!partidoId || !datosEdicion) return;
    try {
      const { fecha, ...rest } = datosEdicion;
      const payload = {
        ...rest,
        fecha: fecha ? new Date(fecha).toISOString() : undefined,
      };
      await editarPartido(partidoId, payload);
      await cargar();
      setModoEdicion(false);
      addToast({ type: 'success', title: 'Guardado', message: 'Se actualizaron los datos del partido' });
    } catch (err) {
      console.error('Error al guardar partido:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos guardar los cambios' });
    }
  };

  const handleRecalcular = async () => {
    if (!partidoId) return;
    try {
      const actualizado = await recalcularMarcadorPartido(partidoId);
      setPartido((prev) => (prev ? { ...prev, ...actualizado } : prev));
      setDatosEdicion((prev) =>
        prev
          ? {
              ...prev,
              marcadorLocal: actualizado.marcadorLocal || 0,
              marcadorVisitante: actualizado.marcadorVisitante || 0,
              marcadorModificadoManualmente: false,
            }
          : prev,
      );
      addToast({ type: 'success', title: 'Marcador actualizado', message: 'Marcador recalculado desde sets' });
    } catch (err) {
      console.error('Error al recalcular marcador:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos recalcular el marcador' });
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del partido"
      subtitle="Información básica y edición rápida"
      size="lg"
      bodyClassName="p-0"
    >
      <div className="space-y-4 px-6 pb-6">
        {loading ? (
          <div className="p-8 space-y-6">
            <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        ) : partido && datosEdicion ? (
          <div className="relative">
            {/* Header de Acciones de Modal */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${modoEdicion ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                   {modoEdicion ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 leading-tight">
                    {modoEdicion ? 'Editando Encuentro' : 'Detalles del Encuentro'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">{partido.nombrePartido || 'ID: ' + partido._id?.substring(0,8)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!modoEdicion ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModoEdicion(true)}
                      className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Editar
                    </button>
                    {partido.estado === 'en_juego' && (
                       <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Gestionar Marcador
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModoEdicion(false)}
                      className="px-3 py-1.5 text-slate-500 text-xs font-bold hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardar}
                      className="inline-flex items-center px-4 py-1.5 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 uppercase tracking-wide"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
            {modoEdicion ? (
              <div className="space-y-6">
                {/* Sección Básica */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-blue-600 mt-2">
                      <div className="p-1 bg-blue-50 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Información General</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Nombre del Partido</label>
                      <input
                        type="text"
                        placeholder="Ej: Gran Final de Verano"
                        value={datosEdicion.nombrePartido}
                        onChange={(e) =>
                          setDatosEdicion((prev) => (prev ? { ...prev, nombrePartido: e.target.value } : prev))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Fecha y Hora</label>
                      <input
                        type="datetime-local"
                        value={datosEdicion.fecha}
                        min={
                          (partido as any)?.fase?.fechaInicio 
                            ? new Date((partido as any).fase.fechaInicio).toISOString().slice(0, 16)
                            : (partido as any)?.competencia?.fechaInicio
                              ? new Date((partido as any).competencia.fechaInicio).toISOString().slice(0, 16)
                              : undefined
                        }
                        max={
                          (partido as any)?.fase?.fechaFin 
                            ? new Date((partido as any).fase.fechaFin).toISOString().slice(0, 16)
                            : (partido as any)?.competencia?.fechaFin
                              ? new Date((partido as any).competencia.fechaFin).toISOString().slice(0, 16)
                              : undefined
                        }
                        onChange={(e) =>
                          setDatosEdicion((prev) => (prev ? { ...prev, fecha: e.target.value } : prev))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      {((partido as any)?.fase?.fechaInicio || (partido as any)?.competencia?.fechaInicio) && (
                        <p className="mt-1 text-[10px] text-blue-500 font-medium px-1 italic">
                          💡 Sugerencia: {(partido as any)?.fase?.nombre || 'Competencia'} entre 
                          {new Date((partido as any)?.fase?.fechaInicio || (partido as any)?.competencia?.fechaInicio).toLocaleDateString()} y 
                          {new Date((partido as any)?.fase?.fechaFin || (partido as any)?.competencia?.fechaFin).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Ubicación / Cancha</label>
                      <input
                        type="text"
                        value={datosEdicion.ubicacion}
                        onChange={(e) =>
                          setDatosEdicion((prev) => (prev ? { ...prev, ubicacion: e.target.value } : prev))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Clasificación */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                      <div className="p-1 bg-indigo-50 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Estado y Categoría</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Estado</label>
                    <select
                      value={datosEdicion.estado}
                      onChange={(e) =>
                        setDatosEdicion((prev) => (prev ? { ...prev, estado: e.target.value } : prev))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="programado">Programado</option>
                      <option value="en_juego">En Juego</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Modalidad</label>
                    <select
                      value={datosEdicion.modalidad}
                      onChange={(e) =>
                        setDatosEdicion((prev) => (prev ? { ...prev, modalidad: e.target.value } : prev))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-60 cursor-not-allowed"
                      disabled={Boolean(partido?.competencia)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Foam">Foam</option>
                      <option value="Cloth">Cloth</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Categoría</label>
                    <select
                      value={datosEdicion.categoria}
                      onChange={(e) =>
                        setDatosEdicion((prev) => (prev ? { ...prev, categoria: e.target.value } : prev))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-60 cursor-not-allowed"
                      disabled={Boolean(partido?.competencia)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                </div>
                </div>

                {/* Sección Torneo Avanzada */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                      <div className="p-1 bg-blue-50 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Ubicación en Torneo</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Competencia</label>
                        <select
                          value={datosEdicion.competencia}
                          onChange={(e) =>
                            setDatosEdicion((prev) => (prev ? { ...prev, competencia: e.target.value } : prev))
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-60 cursor-not-allowed"
                          disabled={Boolean(partido?.competencia)}
                        >
                          <option value="">Sin competencia (Amistoso)</option>
                          {competencias.map((comp) => (
                            <option key={comp.id} value={comp.id}>{comp.nombre}</option>
                          ))}
                        </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Etapa</label>
                      <select
                        value={datosEdicion.etapa || ''}
                        onChange={(e) => setDatosEdicion((prev) => (prev ? { ...prev, etapa: e.target.value } : prev))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      >
                        <option value="">—</option>
                        <option value="octavos">Octavos</option>
                        <option value="cuartos">Cuartos</option>
                        <option value="semifinal">Semifinal</option>
                        <option value="final">Final</option>
                        <option value="tercer_puesto">Tercer puesto</option>
                        <option value="repechaje">Repechaje</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Grupo</label>
                        <input
                          type="text"
                          placeholder="Ej: A"
                          value={datosEdicion.grupo || ''}
                          onChange={(e) => setDatosEdicion((prev) => (prev ? { ...prev, grupo: e.target.value } : prev))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">División</label>
                        <input
                          type="text"
                          placeholder="Ej: 1"
                          value={datosEdicion.division || ''}
                          onChange={(e) => setDatosEdicion((prev) => (prev ? { ...prev, division: e.target.value } : prev))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección Marcador Manual */}
                <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 px-6 py-5 rounded-b-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <div className="p-1 bg-emerald-50 rounded">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">Ajuste de Marcador</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRecalcular}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-100 shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      RECALCULAR DESDE SETS
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                    <div className="space-y-2">
                       <label className="block text-[11px] font-black text-slate-500 uppercase text-center truncate">
                          { (partido.equipoLocal as any)?.nombre || 'Local' }
                       </label>
                       <input
                        type="number"
                        value={datosEdicion.marcadorLocal}
                        onChange={(e) =>
                          setDatosEdicion((prev) =>
                            prev ? { ...prev, marcadorLocal: Number(e.target.value), marcadorModificadoManualmente: true } : prev
                          )
                        }
                        className="w-full text-center text-3xl font-black py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[11px] font-black text-slate-500 uppercase text-center truncate">
                          { (partido.equipoVisitante as any)?.nombre || 'Visitante' }
                       </label>
                       <input
                        type="number"
                        value={datosEdicion.marcadorVisitante}
                        onChange={(e) =>
                          setDatosEdicion((prev) =>
                            prev ? { ...prev, marcadorVisitante: Number(e.target.value), marcadorModificadoManualmente: true } : prev
                          )
                        }
                        className="w-full text-center text-3xl font-black py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 mt-4 italic font-medium">
                    * Modificar manualmente el marcador anulará el cálculo automático por sets.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Scoreboard Estilizado */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  <div className="relative flex items-center justify-between gap-4">
                    {/* Equipo Local */}
                    <div className="flex flex-col items-center gap-3 w-1/3 group">
                      <div className="relative">
                        {(partido.equipoLocal as any)?.escudo ? (
                          <img src={(partido.equipoLocal as any).escudo} alt="Local" className="h-20 w-20 object-contain drop-shadow-md transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white font-bold text-3xl border border-white/20">
                            {(partido.equipoLocal as any)?.nombre?.charAt(0) || 'L'}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-white text-center text-sm lg:text-base leading-tight">
                        {(partido.equipoLocal as any)?.nombre || 'Local'}
                      </span>
                    </div>

                    {/* Centro del Marcador */}
                    <div className="flex flex-col items-center gap-2">
                       {/* Badge de Estado Dinámico */}
                       {partido.estado === 'en_juego' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          En Vivo
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          partido.estado === 'finalizado' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {partido.estado || 'Programado'}
                        </span>
                      )}

                      <div className="flex items-baseline gap-4 mt-1">
                        <span className="text-5xl font-black text-white tabular-nums drop-shadow-sm">{partido.marcadorLocal ?? 0}</span>
                        <span className="text-2xl font-bold text-slate-500">:</span>
                        <span className="text-5xl font-black text-white tabular-nums drop-shadow-sm">{partido.marcadorVisitante ?? 0}</span>
                      </div>
                      
                      <div className="px-3 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-medium tracking-tight">
                        Puntuación Final
                      </div>
                    </div>

                    {/* Equipo Visitante */}
                    <div className="flex flex-col items-center gap-3 w-1/3 group">
                      <div className="relative">
                        {(partido.equipoVisitante as any)?.escudo ? (
                          <img src={(partido.equipoVisitante as any).escudo} alt="Visitante" className="h-20 w-20 object-contain drop-shadow-md transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white font-bold text-3xl border border-white/20">
                            {(partido.equipoVisitante as any)?.nombre?.charAt(0) || 'V'}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-white text-center text-sm lg:text-base leading-tight">
                        {(partido.equipoVisitante as any)?.nombre || 'Visitante'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid de Información Detallada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloque Logística */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       Logística del Encuentro
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-1 h-8 rounded-full bg-blue-500 opacity-20" />
                        <div>
                          <p className="text-[10px] text-slate-500 leading-none">Fecha y Hora</p>
                          <p className="text-sm font-semibold text-slate-800">
                            {partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'No establecida'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-1 h-8 rounded-full bg-emerald-500 opacity-20" />
                        <div>
                          <p className="text-[10px] text-slate-500 leading-none">Ubicación / Cancha</p>
                          <p className="text-sm font-semibold text-slate-800">{partido.ubicacion || 'Sin asignar'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloque Competencia */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                       Contexto del Torneo
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-500 leading-none">Competición</p>
                        <p className="text-sm font-bold text-blue-600">
                          {typeof partido.competencia === 'string'
                            ? partido.competencia
                            : partido.competencia?.nombre || 'Amistoso / Libre'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-slate-500 leading-none">Categoría</p>
                          <p className="text-xs font-semibold text-slate-800">{partido.categoria || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 leading-none">Etapa/Grupo</p>
                          <p className="text-xs font-semibold text-slate-800">
                            {(partido as any).etapa || '—'} { (partido as any).grupo ? `(Grup. ${(partido as any).grupo})` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Otros Datos Técnicos */}
                <div className="flex flex-wrap items-center gap-4 px-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    ID: {partido._id?.substring(0,8)}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-[11px] font-bold text-orange-700">
                    Modalidad: {partido.modalidad || 'No def.'}
                  </span>
                  {(partido as any).division && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-[11px] font-bold text-purple-700">
                      División: {(partido as any).division}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Seleccioná un partido para ver su información.</p>
      )}
    </div>
  </ModalBase>
  );
};

export default ModalInformacionPartido;
