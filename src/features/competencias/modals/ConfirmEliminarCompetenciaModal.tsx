import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';

type Props = {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmEliminarCompetenciaModal({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Eliminar competencia"
      message="¿Eliminar competencia? Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
