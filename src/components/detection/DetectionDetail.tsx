'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Detection } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import DetectionResult from './DetectionResult';
import { formatApiErrorMessage } from '@/lib/api';
import { useDatasetService } from '@/onboarding/useDatasetService';
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
  const { user } = useAuth();
  const dataset = useDatasetService();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [corrected, setCorrected] = useState(detection.ocrText ?? '');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleContribute = async () => {
    if (!token || isAdding) return;
    setIsAdding(true);
    setFormError(null);
    try {
      await dataset.contribute(detection.id, {
        corrected_text: corrected.trim() || undefined,
        gold_label: detection.result,
        notes: note.trim() || undefined,
      });
      setAdded(true);
      setShowForm(false);
      toast(t('dataset.contribute.success'));
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setFormError(msg);
      toast(msg, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t('detection.detailTitle')} size="lg">
      <DetectionResult detection={detection} />
      <div className="mt-4 rounded-xl border border-surface-200 p-3 dark:border-surface-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{t('dataset.contribute.title')}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{t('dataset.contribute.desc')}</p>
            {dataset.isSimulation && (
              <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {t('onboarding.simulationBadge')}
              </p>
            )}
          </div>
          {!added && (
            <Button size="sm" variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm((v) => !v)}>
              {showForm ? t('common.cancel') : t('dataset.contribute.button')}
            </Button>
          )}
        </div>
        {showForm && !added && (
          <div className="mt-3 space-y-3">
            <Textarea
              label={t('dataset.contribute.corrected')}
              value={corrected}
              onChange={(e) => setCorrected(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <Textarea
              label={t('dataset.contribute.notes')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
            />
            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            )}
            <Button size="sm" isLoading={isAdding} onClick={() => void handleContribute()}>
              {isAdding ? t('dataset.adding') : t('dataset.contribute.submit')}
            </Button>
          </div>
        )}
        {added && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-700 dark:text-green-400">{t('dataset.contribute.thanks')}</p>
            {user?.role === 'admin' && (
              <Link href="/admin/dataset" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                {t('dataset.viewDataset')}
              </Link>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
