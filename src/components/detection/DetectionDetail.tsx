'use client';

import { Detection } from '@/types';
import Modal from '@/components/ui/Modal';
import DetectionResult from './DetectionResult';
import { useLocale } from '@/contexts/LocaleContext';

interface DetectionDetailProps {
  detection: Detection;
  onClose: () => void;
}

export default function DetectionDetail({ detection, onClose }: DetectionDetailProps) {
  const { t } = useLocale();
  return (
    <Modal isOpen onClose={onClose} title={t('detection.detailTitle')} size="lg">
      <DetectionResult detection={detection} />
    </Modal>
  );
}
