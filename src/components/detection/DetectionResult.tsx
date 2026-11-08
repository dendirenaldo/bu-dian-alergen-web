'use client';

import { useCallback, useState } from 'react';
import { Detection } from '@/types';
import { formatConfidence, formatDateTime, formatDuration, formatModelName } from '@/lib/format';
import { ShieldCheck, ShieldAlert, Clock, Share2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import AllergenTag from './AllergenTag';
import { resolveDetectedAllergens } from '@/lib/detection-allergens';
import { useLocale } from '@/contexts/LocaleContext';

interface DetectionResultProps {
  detection: Detection;
}

export default function DetectionResult({ detection }: DetectionResultProps) {
  const { t } = useLocale();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const isSafe = detection.result === 'safe';
  const allergens = resolveDetectedAllergens(detection);

  const handleShare = useCallback(async () => {
    setShareNote(null);
    const title = detection.product?.name || t('detection.unknownProduct');
    const text = `${title} — ${isSafe ? t('detection.safeMsg') : t('detection.unsafeMsg')}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as any).share({ title, text, url });
        return;
      }
      throw new Error('no-share');
    } catch {
      // Fallback: salin ke clipboard.
      try {
        const payload = url ? `${text}\n${url}` : text;
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload);
        } else {
          const ta = document.createElement('textarea');
          ta.value = payload;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setShareNote(t('detect.shareCopied'));
      } catch {
        /* abaikan: clipboard tak tersedia */
      }
    }
  }, [detection.product?.name, isSafe, t]);

  return (
    <Card padding="md">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isSafe
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {isSafe ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {detection.product?.name || t('detection.unknownProduct')}
          </h3>
          <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(detection.createdAt)}
            </span>
            <span>{formatDuration(detection.processingTimeMs)}</span>
            {(detection.modelName || (detection.rawModelOutput as any)?.model_name) && (
              <span className="rounded-md bg-surface-100 px-2 py-0.5 font-mono text-xs dark:bg-surface-800">
                {formatModelName(detection.modelName || (detection.rawModelOutput as any)?.model_name)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-700 dark:border-surface-700 dark:text-surface-300"
        >
          <Share2 className="h-3.5 w-3.5" />
          {t('detect.share')}
        </button>
      </div>
      {shareNote && (
        <p role="status" className="mb-3 text-xs text-surface-500 dark:text-surface-400">
          {shareNote}
        </p>
      )}

      <div
        className={`mb-4 rounded-xl p-4 ${
          isSafe
            ? 'bg-green-50 dark:bg-green-900/10'
            : 'bg-red-50 dark:bg-red-900/10'
        }`}
      >
        <p
          className={`text-sm font-medium ${
            isSafe
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          }`}
        >
          {isSafe
            ? t('detection.safeMsg')
            : t('detection.unsafeMsg')}
        </p>
        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
          {t('detection.confidence')} {formatConfidence(detection.confidenceScore)}
        </p>
      </div>

      {allergens.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            {t('detection.allergensFound')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {allergens.map((allergen) => (
              <AllergenTag
                key={allergen.key}
                name={allergen.name}
                severity={allergen.severity}
                confidence={allergen.confidence}
              />
            ))}
          </div>
        </div>
      )}

      {detection.ocrText && (
        <details className="mt-4 rounded-xl border border-surface-200 dark:border-surface-700">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            {t('detect.ocrTitle')}
          </summary>
          <p className="border-t border-surface-200 px-3 py-2 text-sm text-surface-600 dark:border-surface-700 dark:text-surface-400">
            {detection.ocrText}
          </p>
        </details>
      )}

      <p className="mt-4 rounded-xl bg-surface-100 p-3 text-xs leading-relaxed text-surface-500 dark:bg-surface-800 dark:text-surface-400">
        {t('detect.disclaimer')}
      </p>
    </Card>
  );
}
