'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Detection } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import DetectionResult from './DetectionResult';
import { api, formatApiErrorMessage } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocale } from '@/contexts/LocaleContext';

interface DetectionDetailProps {
  detection: Detection;
  onClose: () => void;
}

export default function DetectionDetail({ detection, onClose }: DetectionDetailProps) {
  const { t } = useLocale();
  const { token } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToDataset = async () => {
    if (!token || isAdding) return;
    setIsAdding(true);
    try {
      await api.put(API_ENDPOINTS.DATASET.UPSERT_FROM_DETECTION(detection.id), {}, token);
      setAdded(true);
      toast(t('dataset.upserted'));
    } catch (err) {
      toast(formatApiErrorMessage(err), 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t('detection.detailTitle')} size="lg">
      <DetectionResult detection={detection} />
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={() => void handleAddToDataset()} isLoading={isAdding}>
          {isAdding ? t('dataset.adding') : t('dataset.addToDataset')}
        </Button>
        {added && (
          <Link href="/admin/dataset" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
            {t('dataset.viewDataset')}
          </Link>
        )}
      </div>
    </Modal>
  );
}
