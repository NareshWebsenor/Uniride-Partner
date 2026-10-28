import React from 'react';
import { Modal } from '@/components/ui/Modal';

type Props = {
  closeModal: () => void;
  visibleModel: boolean;
  children: React.ReactNode;
};

export default function CustomModal({
  closeModal,
  visibleModel,
  children,
}: Props) {
  return (
    <Modal visible={visibleModel} onClose={closeModal}>
      {children}
    </Modal>
  );
}
