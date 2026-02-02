import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listTemporadasByCompetencia, crearTemporada, BackendTemporada, actualizarTemporada, eliminarTemporada, listFasesByTemporada, crearFase, generarFixture, BackendFase, actualizarFase, eliminarFase, addCompetenciaAdministrador, getCompetenciaAdministradores, getCompetenciaById, removeCompetenciaAdministrador, actualizarCompetencia, eliminarCompetencia, type AdminUser, listParticipacionesByTemporada, type BackendParticipacionTemporada, crearSolicitudParticipacionTemporada, listParticipacionesByFase, type BackendParticipacionFase, crearParticipacionFase, updateParticipacionTemporada, deleteParticipacionTemporada } from '../services';
import { getPartidosPorCompetencia } from '../../partidos/services/partidoService';
import type { Partido } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { useAuth } from '../../../app/providers/AuthContext';
import GeneralSection from '../sections/GeneralSection';
import EstructuraSection from '../sections/EstructuraSection';
import PartidosSection from '../sections/PartidosSection';
import ConfirmEliminarTemporadaModal from '../modals/ConfirmEliminarTemporadaModal';
import ConfirmEliminarFaseModal from '../modals/ConfirmEliminarFaseModal';
import ConfirmEliminarCompetenciaModal from '../modals/ConfirmEliminarCompetenciaModal';
import CompetenciaRankedSection from '../sections/CompetenciaRankedSection';

const CompetenciaDetallePage = () => {
  const { id: competenciaId } = useParams<{ id: string }>();
  const [temporadas, setTemporadas] = useState<BackendTemporada[]>([]);
  const [fasesPorTemporada, setFasesPorTemporada] = useState<Record<string, BackendFase[]>>({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'general' | 'estructura' | 'partidos' | 'ranked'>('estructura');

  // detalle competencia y admins
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<'Foam' | 'Cloth' | ''>('');
  const [categoria, setCategoria] = useState<'Masculino' | 'Femenino' | 'Mixto' | 'Libre' | ''>('');
  const [tipo, setTipo] = useState<'liga' | 'torneo' | 'otro' | ''>('');
  const [rankedEnabled, setRankedEnabled] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esAdminBackend, setEsAdminBackend] = useState<boolean | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // partidos
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // participaciones
  const [participacionesTemporada, setParticipacionesTemporada] = useState<Record<string, BackendParticipacionTemporada[]>>({});
  const [participacionesFase, setParticipacionesFase] = useState<Record<string, BackendParticipacionFase[]>>({});

  // confirm dialogs
  const [confirmEliminarTemp, setConfirmEliminarTemp] = useState<BackendTemporada | null>(null);
  const [confirmEliminarFase, setConfirmEliminarFase] = useState<{ fase: BackendFase; temporadaId: string } | null>(null);
  const [confirmEliminarComp, setConfirmEliminarComp] = useState(false);

  const { addToast } = useToast();
  const { user } = useAuth();

  const esAdmin = useMemo(() => {
    if (esAdminBackend) return true;
    if (user?.rol === 'admin' || user?.rol === 'manager' || user?.rol === 'editor') return true;
    if (user) {
      const uId = user.id;
      const uEmail = (user.email || '').trim().toLowerCase();
      if (admins.some(a => a._id === uId)) return true;
      if (uEmail && admins.some(a => (a.email || '').trim().toLowerCase() === uEmail)) return true;
    }
    return false;
  }, [esAdminBackend, user, admins]);

  const loadAll = useCallback(async () => {
    if (!competenciaId) return;
    setLoading(true);
    try {
      // detalle competencia
      const detalle = await getCompetenciaById(competenciaId);
      setNombre(detalle.nombre ?? 'Competencia');
      setModalidad((detalle.modalidad as any) ?? '');
      setCategoria((detalle.categoria as any) ?? '');
      setTipo((detalle.tipo as any) ?? '');
      setFechaInicio(detalle.fechaInicio ? detalle.fechaInicio.slice(0, 10) : '');
      setFechaFin(detalle.fechaFin ? detalle.fechaFin.slice(0, 10) : '');
      setDescripcion((detalle as any).descripcion ?? '');
      setRankedEnabled(Boolean((detalle as any).rankedEnabled));
      setEsAdminBackend(Boolean((detalle as any).esAdmin));
      if ((detalle as any).administradores) {
        setAdmins(((detalle as any).administradores as AdminUser[]) || []);
      }

      // admins
      try {
        const { administradores } = await getCompetenciaAdministradores(competenciaId);
        setAdmins(administradores || []);
      } catch {}

      const temps = await listTemporadasByCompetencia(competenciaId);
      setTemporadas(temps);
      const fasesMap: Record<string, BackendFase[]> = {};
      for (const t of temps) {
        fasesMap[t._id] = await listFasesByTemporada(t._id);
      }
      setFasesPorTemporada(fasesMap);

      // participaciones de temporada
      const ptsMap: Record<string, BackendParticipacionTemporada[]> = {};
      for (const t of temps) {
        ptsMap[t._id] = await listParticipacionesByTemporada(t._id);
      }
      setParticipacionesTemporada(ptsMap);

      // participaciones por fase
      const pfMap: Record<string, BackendParticipacionFase[]> = {};
      for (const t of temps) {
        for (const f of fasesMap[t._id] || []) {
          pfMap[f._id] = await listParticipacionesByFase(f._id);
        }
      }
      setParticipacionesFase(pfMap);

      // partidos
      const listaPartidos = await getPartidosPorCompetencia(competenciaId);
      setPartidos(listaPartidos);
    } finally {
      setLoading(false);
    }
  }, [competenciaId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onGenerarFixture = async (faseId: string) => {
    await generarFixture(faseId);
    addToast({ type: 'success', title: 'Fixture generado' });
  };

  const onEditarTemporada = async (t: BackendTemporada) => {
    const nuevo = window.prompt('Nuevo nombre de la temporada:', t.nombre) || t.nombre;
    if (!nuevo) return;
    await actualizarTemporada(t._id, { nombre: nuevo });
    const temps = await listTemporadasByCompetencia(competenciaId!);
    setTemporadas(temps);
  };

  const onEliminarTemporada = async (t: BackendTemporada) => {
    setConfirmEliminarTemp(t);
  };

  const onEditarFase = async (fase: BackendFase, temporadaId: string) => {
    const nuevo = window.prompt('Nuevo nombre de la fase:', fase.nombre || 'Fase') || fase.nombre;
    if (!nuevo) return;
    await actualizarFase(fase._id, { nombre: nuevo });
    const fases = await listFasesByTemporada(temporadaId);
    setFasesPorTemporada((prev) => ({ ...prev, [temporadaId]: fases }));
  };

  const onEliminarFase = async (fase: BackendFase, temporadaId: string) => {
    setConfirmEliminarFase({ fase, temporadaId });
  };

  const guardarGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competenciaId) return;
    setSaving(true);
    try {
      await actualizarCompetencia(competenciaId, {
        nombre,
        modalidad: modalidad || undefined,
        categoria: categoria || undefined,
        tipo: tipo || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        descripcion,
        rankedEnabled,
      });
      addToast({ type: 'success', title: 'Competencia actualizada' });
    } finally {
      setSaving(false);
    }
  };

  const eliminarEstaCompetencia = async () => {
    setConfirmEliminarComp(true);
  };

  const agregarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competenciaId || !adminEmail.trim()) return;
    await addCompetenciaAdministrador(competenciaId, { email: adminEmail.trim() });
    setAdminEmail('');
    const { administradores } = await getCompetenciaAdministradores(competenciaId);
    setAdmins(administradores || []);
  };

  const quitarAdmin = async (adminId: string) => {
    if (!competenciaId) return;
    await removeCompetenciaAdministrador(competenciaId, adminId);
    const { administradores } = await getCompetenciaAdministradores(competenciaId);
    setAdmins(administradores || []);
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
    if (!competenciaId) return;
    await crearTemporada({ competencia: competenciaId, nombre: payload.nombre, fechaInicio: payload.fechaInicio, fechaFin: payload.fechaFin });
    const temps = await listTemporadasByCompetencia(competenciaId);
    setTemporadas(temps);
  };

  const crearFaseHandler = async (
    temporadaId: string,
    payload: {
      nombre: string;
      descripcion?: string;
      tipo?: 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
      orden?: number;
      fechaInicio?: string;
      fechaFin?: string;
      numeroClasificados?: number;
      faseOrigenA?: string;
      faseOrigenB?: string;
    }
  ) => {
    await crearFase({ temporada: temporadaId, ...payload });
    const fases = await listFasesByTemporada(temporadaId);
    setFasesPorTemporada((prev) => ({ ...prev, [temporadaId]: fases }));
  };

  const updateParticipacionTemporadaHandler = async (id: string, body: Partial<{ estado: string }>) => {
    await updateParticipacionTemporada(id, body);
    let tempIdToRefresh: string | undefined;
    for (const [tid, items] of Object.entries(participacionesTemporada)) {
      if ((items || []).some((it) => it._id === id)) { tempIdToRefresh = tid; break; }
    }
    if (tempIdToRefresh) {
      const list = await listParticipacionesByTemporada(tempIdToRefresh);
      setParticipacionesTemporada((prev) => ({ ...prev, [tempIdToRefresh!]: list }));
    }
  };

  const deleteParticipacionTemporadaHandler = async (id: string, temporadaId: string) => {
    await deleteParticipacionTemporada(id);
    const list = await listParticipacionesByTemporada(temporadaId);
    setParticipacionesTemporada((prev) => ({ ...prev, [temporadaId]: list }));
  };

  if (!competenciaId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Competencia no encontrada</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <nav className="text-xs text-slate-500">
          <Link className="hover:underline" to="/competencias">Competencias</Link>
          <span> / </span>
          <span className="text-slate-700 font-medium">{nombre || 'Competencia'}</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-900">{nombre || 'Competencia'}</h1>
        <p className="text-sm text-slate-500">Administración y estructura</p>
        <div className="mt-2 flex gap-2 text-sm overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          {(['general','estructura','partidos', ...(rankedEnabled ? ['ranked'] as const : [])] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${tab===t ? 'bg-brand-100 text-brand-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {t === 'general' ? 'General' : t === 'estructura' ? 'Temporadas/Fases' : t === 'partidos' ? 'Partidos' : 'Ranked'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'general' ? (
        <GeneralSection
          nombre={nombre}
          setNombre={setNombre}
          modalidad={modalidad}
          setModalidad={setModalidad as any}
          categoria={categoria}
          setCategoria={setCategoria as any}
          tipo={tipo}
          setTipo={setTipo as any}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          rankedEnabled={rankedEnabled}
          setRankedEnabled={setRankedEnabled}
          esAdmin={esAdmin}
          saving={saving}
          onSubmit={guardarGeneral}
          adminEmail={adminEmail}
          setAdminEmail={setAdminEmail}
          admins={admins}
          onAgregarAdmin={agregarAdmin}
          onQuitarAdmin={quitarAdmin}
          onEliminarCompetenciaRequested={eliminarEstaCompetencia}
        />
      ) : null}

      {tab === 'estructura' ? (
        <EstructuraSection
          esAdmin={esAdmin}
          loading={loading}
          onRefresh={loadAll}
          onSubmitCrearTemporada={crearTemporadaHandler}
          temporadas={temporadas}
          fasesPorTemporada={fasesPorTemporada}
          onSubmitCrearFase={crearFaseHandler}
          onEditarTemporada={onEditarTemporada}
          onEliminarTemporada={onEliminarTemporada}
          onGenerarFixture={onGenerarFixture}
          onEditarFase={onEditarFase}
          onEliminarFase={onEliminarFase}
          participacionesTemporadaPorId={participacionesTemporada}
          participacionesFasePorId={participacionesFase}
          onCrearSolicitudParticipacionTemporada={crearSolicitudParticipacionTemporadaHandler}
          onCrearParticipacionFase={crearParticipacionFaseHandler}
          onUpdateParticipacionTemporada={updateParticipacionTemporadaHandler}
          onDeleteParticipacionTemporada={deleteParticipacionTemporadaHandler}
        />
      ) : null}

      

      {tab === 'partidos' ? (
        <PartidosSection partidos={partidos} filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado} />
      ) : null}

      {tab === 'ranked' ? (
        <CompetenciaRankedSection competenciaId={competenciaId} modalidad={modalidad} categoria={categoria} />
      ) : null}

      {confirmEliminarTemp ? (
        <ConfirmEliminarTemporadaModal
          isOpen={true}
          nombre={confirmEliminarTemp.nombre}
          onConfirm={async () => {
            await eliminarTemporada(confirmEliminarTemp._id);
            const temps = await listTemporadasByCompetencia(competenciaId!);
            setTemporadas(temps);
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
          isOpen={true}
          nombre={confirmEliminarFase.fase.nombre}
          onConfirm={async () => {
            await eliminarFase(confirmEliminarFase.fase._id);
            const fases = await listFasesByTemporada(confirmEliminarFase.temporadaId);
            setFasesPorTemporada((prev) => ({ ...prev, [confirmEliminarFase.temporadaId]: fases }));
            setConfirmEliminarFase(null);
            addToast({ type: 'success', title: 'Fase eliminada' });
          }}
          onCancel={() => setConfirmEliminarFase(null)}
        />
      ) : null}

      {confirmEliminarComp ? (
        <ConfirmEliminarCompetenciaModal
          isOpen={true}
          onConfirm={async () => {
            if (!competenciaId) return;
            await eliminarCompetencia(competenciaId);
            window.location.href = '/competencias';
          }}
          onCancel={() => setConfirmEliminarComp(false)}
        />
      ) : null}
    </div>
  );
};

export default CompetenciaDetallePage;
