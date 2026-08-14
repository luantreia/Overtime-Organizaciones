import { useCallback, useEffect, useState } from 'react';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import ModalBase from '../../../shared/components/ModalBase/ModalBase';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import {
  listAsignacionesPorPartido,
  listAsignacionesPorFase,
  crearAsignacion,
  revocarAsignacion,
  finDelDia,
  nombreDeUsuario,
  emailDeUsuario,
  ROLES_PLANILLERO,
  type BackendAsignacionPartido,
  type RolPlanillero,
} from '../services/asignacionesPartidoService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Alcance: si viene `partidoId` es una asignación puntual; si no, es el cuerpo estable de la fase. */
  partidoId?: string;
  faseId?: string;
  /** Fecha del partido — se usa para vencer la asignación al final de ese día. */
  fechaPartido?: string;
  titulo?: string;
  subtitulo?: string;
};

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function Fila({
  a,
  heredada,
  onRevocar,
}: {
  a: BackendAsignacionPartido;
  heredada?: boolean;
  onRevocar?: (id: string) => void;
}) {
  const email = emailDeUsuario(a);
  const rol = ROLES_PLANILLERO.find((r) => r.value === a.rol);
  return (
    <li className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 py-2.5 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{nombreDeUsuario(a)}</p>
        {email && <p className="truncate text-xs text-slate-400">{email}</p>}
      </div>
      <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        {rol?.label || a.rol}
      </span>
      {a.hasta && (
        <span className="flex-shrink-0 text-[11px] text-slate-400">
          hasta {new Date(a.hasta).toLocaleDateString()}
        </span>
      )}
      {heredada ? (
        <span className="flex-shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          de la fase
        </span>
      ) : (
        onRevocar && (
          <button
            type="button"
            title="Revocar acceso"
            onClick={() => onRevocar(a._id)}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )
      )}
    </li>
  );
}

export default function GestionPlanillerosModal({
  isOpen,
  onClose,
  partidoId,
  faseId,
  fechaPartido,
  titulo,
  subtitulo,
}: Props) {
  const [propias, setPropias] = useState<BackendAsignacionPartido[]>([]);
  const [heredadas, setHeredadas] = useState<BackendAsignacionPartido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolPlanillero>('planillero');
  const { addToast } = useToast();

  const esDePartido = !!partidoId;

  const cargar = useCallback(async () => {
    if (!isOpen) return;
    setCargando(true);
    try {
      if (esDePartido && partidoId) {
        const [delPartido, deLaFase] = await Promise.all([
          listAsignacionesPorPartido(partidoId),
          faseId ? listAsignacionesPorFase(faseId) : Promise.resolve([] as BackendAsignacionPartido[]),
        ]);
        setPropias(delPartido.filter((a) => a.estado === 'activa'));
        setHeredadas(deLaFase.filter((a) => a.estado === 'activa'));
      } else if (faseId) {
        const deLaFase = await listAsignacionesPorFase(faseId);
        setPropias(deLaFase.filter((a) => a.estado === 'activa'));
        setHeredadas([]);
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los planilleros' });
    } finally {
      setCargando(false);
    }
  }, [isOpen, esDePartido, partidoId, faseId, addToast]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setRol('planillero');
    }
  }, [isOpen]);

  const handleAgregar = async () => {
    if (!email.trim()) {
      addToast({ type: 'error', title: 'Falta el email', message: 'Escribí el email de la persona' });
      return;
    }
    setGuardando(true);
    try {
      await crearAsignacion({
        email: email.trim(),
        ...(esDePartido ? { partido: partidoId } : { fase: faseId }),
        rol,
        // Una asignación de partido vence al terminar ese día: los colaboradores suelen usar un
        // teléfono prestado y el acceso no debería sobrevivir a la devolución del aparato.
        hasta: esDePartido ? finDelDia(fechaPartido) : undefined,
      });
      addToast({ type: 'success', title: 'Listo', message: 'Acceso otorgado' });
      setEmail('');
      await cargar();
    } catch (error: any) {
      addToast({ type: 'error', title: 'No se pudo asignar', message: error?.message || 'Revisá el email' });
    } finally {
      setGuardando(false);
    }
  };

  const handleRevocar = async (id: string) => {
    try {
      await revocarAsignacion(id);
      addToast({ type: 'success', title: 'Acceso revocado' });
      await cargar();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error?.message || 'No pudimos revocar' });
    }
  };

  if (!isOpen) return null;

  const ayudaRol = ROLES_PLANILLERO.find((r) => r.value === rol)?.ayuda;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={titulo || (esDePartido ? 'Planilleros del partido' : 'Planilleros de la fase')}
      subtitle={subtitulo}
      size="md"
      bodyClassName="p-4 sm:p-5"
      footer={
        <div className="flex justify-end px-4 pb-1 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Heredados de la fase: se muestran para que se entienda por qué alguien puede cargar
            este partido sin figurar asignado acá. */}
        {heredadas.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Del cuerpo de la fase
            </h4>
            <ul className="mt-1 divide-y divide-slate-100 border-t border-slate-100">
              {heredadas.map((a) => (
                <Fila key={a._id} a={a} heredada />
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Ya pueden cargar este partido. Se gestionan desde la fase.
            </p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {esDePartido ? 'Asignados a este partido' : 'Cuerpo estable de la fase'}
          </h4>
          {cargando ? (
            <div className="mt-2 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : propias.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center">
              <p className="text-sm text-slate-400">
                {esDePartido ? 'Nadie asignado a este partido' : 'Todavía no hay planilleros en esta fase'}
              </p>
            </div>
          ) : (
            <ul className="mt-1 divide-y divide-slate-100 border-t border-slate-100">
              {propias.map((a) => (
                <Fila key={a._id} a={a} onRevocar={handleRevocar} />
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
            <UserPlusIcon className="h-4 w-4" />
            Dar acceso
          </h4>
          <div className="mt-3 space-y-2">
            <input
              type="email"
              inputMode="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={rol} onChange={(e) => setRol(e.target.value as RolPlanillero)} className={inputClass}>
                {ROLES_PLANILLERO.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleAgregar()}
                disabled={guardando || !email.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Dando acceso…' : 'Dar acceso'}
              </button>
            </div>
            {ayudaRol && <p className="text-[11px] text-slate-500">{ayudaRol}</p>}
            <p className="text-[11px] text-slate-400">
              {esDePartido
                ? 'El acceso vence al final del día del partido.'
                : 'Habilita a la persona en todos los partidos de esta fase.'}{' '}
              Nunca permite editar un partido ya finalizado.
            </p>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
