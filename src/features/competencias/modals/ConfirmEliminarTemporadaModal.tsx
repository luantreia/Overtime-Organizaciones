import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

type Props = {
  isOpen: boolean;
  nombre: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmEliminarTemporadaModal({ isOpen, nombre, onConfirm, onCancel }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Eliminar temporada"
      message={`¿Eliminar la temporada "${nombre}"?`}
      confirmLabel="Eliminar"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
