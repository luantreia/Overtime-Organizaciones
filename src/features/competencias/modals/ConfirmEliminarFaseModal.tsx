import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

type Props = {
  isOpen: boolean;
  nombre?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmEliminarFaseModal({ isOpen, nombre, onConfirm, onCancel }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Eliminar fase"
      message={`¿Eliminar la fase "${nombre ?? 'Fase'}"?`}
      confirmLabel="Eliminar"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
