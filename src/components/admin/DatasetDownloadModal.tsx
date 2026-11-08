'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MenuSelect from '@/components/ui/MenuSelect';
import Alert from '@/components/ui/Alert';
import { DatasetEstimate } from '@/types';
import { api, formatApiErrorMessage } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocale } from '@/contexts/LocaleContext';
import { unwrapData } from '@/lib/unwrap';

interface DatasetDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(n: number, locale: string): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  const num = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    maximumFractionDigits: v >= 100 ? 0 : 1,
  }).format(v);
  return `~${num} ${units[u]}`;
}

export default function DatasetDownloadModal({ isOpen, onClose }: DatasetDownloadModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const [status, setStatus] = useState('');
  const [label, setLabel] = useState('');
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSplit, setIncludeSplit] = useState(true);
  const [estimate, setEstimate] = useState<DatasetEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const estimateAbortRef = useRef<AbortController | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (label) p.set('label', label);
    p.set('includeLabels', includeLabels ? '1' : '0');
    p.set('includeImages', includeImages ? '1' : '0');
    p.set('includeSplit', includeSplit ? '1' : '0');
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [status, label, includeLabels, includeImages, includeSplit]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      estimateAbortRef.current?.abort();
      downloadAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setEstimate(null);
      setProgress(null);
      setError(null);
      setIsDownloading(false);
      estimateAbortRef.current?.abort();
      downloadAbortRef.current?.abort();
      return;
    }
    if (!token) return;
    setEstimateLoading(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      estimateAbortRef.current?.abort();
      const ctrl = new AbortController();
      estimateAbortRef.current = ctrl;
      api
        .get(`${API_ENDPOINTS.DATASET.ESTIMATE}${buildQuery()}`, token, ctrl.signal)
        .then((res) => {
          const data = unwrapData<DatasetEstimate>(res);
          setEstimate(data);
          setError(null);
        })
        .catch((err: any) => {
          if (err?.name === 'AbortError') return;
          const msg = formatApiErrorMessage(err);
          setError(msg);
          toast(msg, 'error');
        })
        .finally(() => setEstimateLoading(false));
    }, 400);
    return () => {
      estimateAbortRef.current?.abort();
    };
  }, [isOpen, token, buildQuery, toast]);

  const handleDownload = async () => {
    if (!token || isDownloading) return;
    setIsDownloading(true);
    setProgress(0);
    setError(null);
    downloadAbortRef.current?.abort();
    const ctrl = new AbortController();
    downloadAbortRef.current = ctrl;
    const onDownloadProgress = (pct: number) => setProgress(Math.min(1, Math.max(0, pct)));
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.DATASET.DOWNLOAD}${buildQuery()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: 'Request failed' }));
        throw { status: res.status, statusCode: res.status, message: String(payload?.message ?? 'Request failed'), fieldErrors: {} };
      }
      const totalHeader = Number(res.headers.get('Content-Length'));
      const total = Number.isFinite(totalHeader) && totalHeader > 0 ? totalHeader : (estimate?.bytes ?? 0);
      const reader = res.body?.getReader();
      const chunks: BlobPart[] = [];
      if (reader) {
        let loaded = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total > 0) onDownloadProgress(loaded / total);
          }
        }
      } else {
        const blob = await res.blob();
        chunks.push(blob);
      }
      onDownloadProgress(1);
      const blob = new Blob(chunks, { type: 'application/zip' });
      const d = new Date();
      const pad = (v: number) => String(v).padStart(2, '0');
      const ymd = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const fromHeader = disposition.match(/filename="?([^";]+)"?/)?.[1];
      const filename =
        fromHeader ||
        `dataset_${status || 'verified'}_${label || 'all'}_${ymd}_${estimate?.fileCount ?? 0}files.zip`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
      toast(t('dataset.downloaded'));
      onClose();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const msg = formatApiErrorMessage(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      if (downloadAbortRef.current === ctrl) downloadAbortRef.current = null;
      setIsDownloading(false);
    }
  };

  const rows = estimate?.breakdown?.datasetCsv?.rows ?? estimate?.breakdown?.manifestCsv?.rows ?? 0;
  const missing = estimate?.breakdown?.images?.missing ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('dataset.downloadTitle')} size="md">
      <div className="space-y-4">
        {error && (
          <Alert variant="error" title={t('api.err.failed')}>
            {error}
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          <MenuSelect
            label={t('dataset.filterStatus')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: t('dataset.allStatus') },
              { value: 'draft', label: t('dataset.statusDraft') },
              { value: 'verified', label: t('dataset.statusVerified') },
            ]}
          />
          <MenuSelect
            label={t('dataset.filterLabel')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            options={[
              { value: '', label: t('dataset.allLabels') },
              { value: 'safe', label: t('result.safe') },
              { value: 'unsafe', label: t('result.unsafe') },
            ]}
          />
        </div>

        <fieldset className="space-y-2">
          {[
            { checked: includeLabels, set: setIncludeLabels, label: t('dataset.includeLabels') },
            { checked: includeImages, set: setIncludeImages, label: t('dataset.includeImages') },
            { checked: includeSplit, set: setIncludeSplit, label: t('dataset.includeSplit') },
          ].map((c) => (
            <label key={c.label} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
              <input
                type="checkbox"
                checked={c.checked}
                onChange={(e) => c.set(e.target.checked)}
                className="h-4 w-4 accent-primary-600"
              />
              {c.label}
            </label>
          ))}
          <p className="text-xs text-surface-500 dark:text-surface-400">
            dataset.csv + manifest.csv + images/ + split.json + README.txt
          </p>
        </fieldset>

        {missing > 0 && (
          <Alert variant="warning" title={t('dataset.imagesMissingTitle')}>
            {t('dataset.imagesMissing', { n: missing })}
          </Alert>
        )}
        <div className="rounded-xl bg-surface-50 p-3 text-sm text-surface-700 dark:bg-surface-800 dark:text-surface-300">
          {estimateLoading ? (
            <span>{t('dataset.estimateLoading')}</span>
          ) : estimate ? (
            <span>
              {t('dataset.estimateInfo', {
                size: formatBytes(estimate.bytes, locale),
                files: estimate.fileCount,
                rows,
              })}
            </span>
          ) : (
            <span>{t('dataset.estimateNone')}</span>
          )}
        </div>

        {progress !== null && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              {t('dataset.progress', { pct: `${Math.round((progress ?? 0) * 100)}%` })}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDownloading}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleDownload} isLoading={isDownloading}>
            {t('dataset.startDownload')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
