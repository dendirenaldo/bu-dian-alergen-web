'use client';

import { Detection } from '@/types';
import Modal from '@/components/ui/Modal';
import DetectionResult from './DetectionResult';

interface DetectionDetailProps {
  detection: Detection;
  onClose: () => void;
}

export default function DetectionDetail({ detection, onClose }: DetectionDetailProps) {
  return (
    <Modal isOpen onClose={onClose} title="Detail Deteksi" size="lg">
      <DetectionResult detection={detection} />
    </Modal>
  );
}
