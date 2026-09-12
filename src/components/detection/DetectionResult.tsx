'use client';

import { Detection } from '@/types';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import AllergenTag from './AllergenTag';

interface DetectionResultProps {
  detection: Detection;
}

export default function DetectionResult({ detection }: DetectionResultProps) {
  const isSafe = detection.result === 'safe';

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
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {detection.product?.name || 'Produk Tidak Dikenal'}
          </h3>
          <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(detection.createdAt)}
            </span>
            <span>{detection.processingTimeMs}ms</span>
          </div>
        </div>
      </div>

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
            ? '✓ Aman - Tidak ditemukan alergen berbahaya'
            : '⚠ Berbahaya - Ditemukan alergen pada produk ini'}
        </p>
        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
          Confidence Score: {Math.round(detection.confidenceScore * 100)}%
        </p>
      </div>

      {detection.detectionAllergens && detection.detectionAllergens.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            Alergen Terdeteksi:
          </h4>
          <div className="flex flex-wrap gap-2">
            {detection.detectionAllergens.map((allergen) => (
              <AllergenTag
                key={allergen.allergenId}
                name={allergen.name}
                severity={allergen.severityLevel}
                confidence={allergen.confidenceScore}
              />
            ))}
          </div>
        </div>
      )}

      {detection.ocrText && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            Teks OCR:
          </h4>
          <p className="rounded-lg bg-surface-50 p-3 text-sm text-surface-600 dark:bg-surface-800 dark:text-surface-400">
            {detection.ocrText}
          </p>
        </div>
      )}
    </Card>
  );
}
