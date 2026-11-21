'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileArchive, FlaskConical } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MenuSelect from '@/components/ui/MenuSelect';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/contexts/ToastContext';
import { useDatasetService } from '@/onboarding/useDatasetService';
import { emitTourAction } from '@/onboarding/types';
import {
  EXPORT_PROFILE_DESC_KEYS,
  EXPORT_PROFILE_KEYS,
  formatBytes,
} from '@/lib/dataset-meta';
import type {
  DatasetExportPreview,
  DatasetExportRecord,
  ExportFormat,
  ExportProfile,
} from '@/types';

interface DatasetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: string;
  initialLabel?: string;
}

const PROFILES: ExportProfile[] = ['nlp', 'raw', 'image_classification', 'multimodal'];
const FORMATS: ExportFormat[] = ['jsonl', 'csv', 'json'];

const DEFAULT_FORMAT: Record<ExportProfile, ExportFormat> = {
  raw: 'json',
  nlp: 'jsonl',
  image_classification: 'csv',
  multimodal: 'jsonl',
};

const STATUS_CHOICES = [
  { value: 'verified,approved', key: 'dataset.export.statusReady' },
  { value: 'approved', key: 'dataset.status.approved' },
  { value: 'verified', key: 'dataset.status.verified' },
  { value: 'pending_review', key: 'dataset.status.pending_review' },
  { value: 'draft', key: 'dataset.status.draft' },
];

const REASON_KEYS: Record<string, string> = {
  empty_text: 'dataset.export.reason.empty_text',
  missing_image: 'dataset.export.reason.missing_image',
  no_text_and_no_image: 'dataset.export.reason.no_text_and_no_image',
  export_eligible_false: 'dataset.export.reason.export_eligible_false',
};

export default function DatasetExportModal({
  isOpen,
  onClose,
  initialStatus = 'verified,approved',
  initialLabel = '',
}: DatasetExportModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const service = useDatasetService();

  const [profile, setProfile] = useState<ExportProfile>('nlp');
  const [format, setFormat] = useState<ExportFormat>('jsonl');
  const [status, setStatus] = useState(initialStatus);
  const [label, setLabel] = useState(initialLabel);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSplits, setIncludeSplits] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [seed, setSeed] = useState('42');
  const [train, setTrain] = useState('0.7');
  const [validation, setValidation] = useState('0.15');
  const [test, setTest] = useState('0.15');
  const [advanced, setAdvanced] = useState(false);
  const [preview, setPreview] = useState<DatasetExportPreview | null>(null);
  const [record, setRecord] = useState<DatasetExportRecord | null>(null);
  const [history, setHistory] = useState<DatasetExportRecord[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = useMemo(
    () => ({
      profile,
      format,
      status,
      label: label || undefined,
      includeImages,
      includeSplits,
      includeSchema,
      seed: Number(seed) || 0,
      trainRatio: Number(train) || 0,
      validationRatio: Number(validation) || 0,
      testRatio: Number(test) || 0,
    }),
    [includeImages, includeSplits, includeSchema, format, label, profile, seed, status, test, train, validation],
  );

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await service.exportHistory());
    } catch {
      setHistory([]);
    }
  }, [service]);

  useEffect(() => {
    if (!isOpen) return;
    setStatus(initialStatus);
    setLabel(initialLabel);
    setPreview(null);
    setRecord(null);
    setError(null);
    void refreshHistory();
    // Sengaja tidak bergantung pada config: reset hanya saat modal dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setPreview(null);
    setRecord(null);
  }, [profile, format, status, label, includeImages, includeSplits, seed, train, validation, test]);

  const chooseProfile = (p: ExportProfile) => {
    setProfile(p);
    setFormat(DEFAULT_FORMAT[p]);
    // Profil gambar tidak bermakna tanpa gambar.
    if (p === 'image_classification') setIncludeImages(true);
    emitTourAction('export-profile-select', { profile: p });
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const result = await service.exportPreview(config);
      setPreview(result);
      emitTourAction('export-preview');
    } catch (err: any) {
      setError(err?.message ?? t('dataset.export.failed'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await service.createExport(config);
      setRecord(result);
      emitTourAction('export-generate');
      toast(t('dataset.export.done'));
      await refreshHistory();
    } catch (err: any) {
      setError(err?.message ?? t('dataset.export.failed'));
      toast(t('dataset.export.failed'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (r: DatasetExportRecord) => {
    try {
      await service.downloadExport(r);
    } catch (err: any) {
      toast(err?.message ?? t('dataset.export.failed'), 'error');
    }
  };

  const ratioSum = (Number(train) || 0) + (Number(validation) || 0) + (Number(test) || 0);
  const ratioValid = Math.abs(ratioSum - 1) < 0.001;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('dataset.export.title')} size="xl" className="max-w-3xl">
      <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
        <p className="text-sm text-surface-600 dark:text-surface-300">{t('dataset.export.subtitle')}</p>
        {service.isSimulation && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <FlaskConical className="h-3 w-3" />
            {t('onboarding.simulationBadge')}
          </div>
        )}
        {error && (
          <Alert variant="error" title={t('dataset.export.failed')}>
            {error}
          </Alert>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-surface-900 dark:text-surface-100">{t('dataset.export.profile')}</h3>
          <div className="grid gap-2 sm:grid-cols-2" data-tour="export-profiles">
            {PROFILES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => chooseProfile(p)}
                aria-pressed={profile === p}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  profile === p
                    ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20'
                    : 'border-surface-200 hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600'
                }`}
              >
                <span className="block text-sm font-semibold text-surface-900 dark:text-surface-100">{t(EXPORT_PROFILE_KEYS[p])}</span>
                <span className="mt-0.5 block text-xs text-surface-500 dark:text-surface-400">{t(EXPORT_PROFILE_DESC_KEYS[p])}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <MenuSelect
            label={t('dataset.export.format')}
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            options={FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))}
          />
          <MenuSelect
            label={t('dataset.filterStatus')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_CHOICES.map((c) => ({ value: c.value, label: t(c.key) }))}
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

        <div className="flex flex-wrap gap-4 text-sm text-surface-700 dark:text-surface-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeImages}
              disabled={profile === 'image_classification' || profile === 'nlp'}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="h-4 w-4 accent-primary-600 disabled:opacity-50"
            />
            {t('dataset.export.includeImages')}
            {(profile === 'image_classification' || profile === 'nlp') && (
              <span className="text-xs text-surface-500">({profile === 'nlp' ? 'N/A' : t('dataset.field.required')})</span>
            )}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={includeSplits} onChange={(e) => setIncludeSplits(e.target.checked)} className="h-4 w-4 accent-primary-600" />
            {t('dataset.export.includeSplits')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={includeSchema} onChange={(e) => setIncludeSchema(e.target.checked)} className="h-4 w-4 accent-primary-600" />
            {t('dataset.export.includeSchema')}
          </label>
        </div>

        <div>
          <button type="button" onClick={() => setAdvanced((v) => !v)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            {advanced ? '− ' : '+ '}
            {t('dataset.export.advanced')}
          </button>
          {advanced && (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Input label={t('dataset.export.seed')} type="number" min={0} value={seed} onChange={(e) => setSeed(e.target.value)} />
              <Input label={t('dataset.export.train')} type="number" step={0.05} min={0} max={1} value={train} onChange={(e) => setTrain(e.target.value)} />
              <Input label={t('dataset.export.validation')} type="number" step={0.05} min={0} max={1} value={validation} onChange={(e) => setValidation(e.target.value)} />
              <Input label={t('dataset.export.test')} type="number" step={0.05} min={0} max={1} value={test} onChange={(e) => setTest(e.target.value)} />
            </div>
          )}
          {advanced && !ratioValid && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">Total rasio = {ratioSum.toFixed(2)} (harus 1.00)</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handlePreview} isLoading={loadingPreview} data-tour="export-preview">
            {loadingPreview ? t('dataset.export.previewing') : t('dataset.export.preview')}
          </Button>
          <Button type="button" onClick={handleGenerate} isLoading={generating} disabled={!ratioValid} data-tour="export-generate">
            <FileArchive className="mr-1.5 h-4 w-4" />
            {generating ? t('dataset.export.generating') : t('dataset.export.generate')}
          </Button>
        </div>
        <p className="text-xs text-surface-500 dark:text-surface-400">{t('dataset.export.unsavedHint')}</p>

        {preview && (
          <section className="space-y-3 rounded-xl border border-surface-200 p-4 dark:border-surface-700">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-surface-500">{t('dataset.export.selected')}</p>
                <p className="font-semibold">{preview.counts.selected}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">{t('dataset.export.eligible')}</p>
                <p className="font-semibold">{preview.counts.eligible}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">{t('dataset.export.excluded')}</p>
                <p className="font-semibold">{preview.counts.excluded}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">{t('dataset.export.estimated')}</p>
                <p className="font-semibold">{formatBytes(preview.estimatedBytes)}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-surface-500">{t('dataset.export.labelDist')}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(preview.labelDistribution)
                  .filter(([, n]) => n > 0)
                  .map(([name, n]) => (
                    <Badge key={name} variant="default">
                      {name}: {n}
                    </Badge>
                  ))}
              </div>
            </div>

            {preview.split && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs font-medium text-surface-500">{t('dataset.export.split')}:</span>
                <Badge variant="info">{t('dataset.export.train')} {preview.split.counts.train}</Badge>
                <Badge variant="info">{t('dataset.export.validation')} {preview.split.counts.validation}</Badge>
                <Badge variant="info">{t('dataset.export.test')} {preview.split.counts.test}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  {t('dataset.export.audit')}: {preview.integrity.auditPassed ? t('dataset.export.pass') : t('dataset.export.fail')}
                </span>
              </div>
            )}

            {preview.excluded.length > 0 && (
              <div className="text-xs text-surface-500">
                {preview.excluded.slice(0, 5).map((x) => (
                  <p key={`${x.id}-${x.reason}`}>
                    #{x.id}: {REASON_KEYS[x.reason] ? t(REASON_KEYS[x.reason]) : x.reason}
                  </p>
                ))}
                {preview.excluded.length > 5 && <p>+{preview.excluded.length - 5}…</p>}
              </div>
            )}
            <p className="text-xs text-surface-500">{t('dataset.export.excludedNote')}</p>
            {preview.warnings.length > 0 && (
              <Alert variant="warning" title={t('dataset.export.warnings')}>
                <ul className="list-inside list-disc space-y-1">
                  {preview.warnings.slice(0, 4).map((w) => (
                    <li key={w.code}>{w.message}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </section>
        )}

        {record && (
          <Alert variant="success" title={t('dataset.export.done')}>
            <div className="mt-1 space-y-1 text-sm">
              <p className="font-mono text-xs">{record.filename}</p>
              <p>
                {t('dataset.export.historyMeta', {
                  records: record.recordCount,
                  images: record.imageCount,
                  size: formatBytes(record.bytes),
                })}
              </p>
              <Button type="button" size="sm" onClick={() => void handleDownload(record)}>
                <Download className="mr-1.5 h-4 w-4" />
                {t('dataset.export.download')}
              </Button>
            </div>
          </Alert>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-surface-900 dark:text-surface-100">{t('dataset.export.history')}</h3>
          {history.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('dataset.export.noHistory')}</p>
          ) : (
            <ul className="divide-y divide-surface-100 rounded-xl border border-surface-200 dark:divide-surface-800 dark:border-surface-700">
              {history.slice(0, 5).map((h) => (
                <li key={h.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-surface-700 dark:text-surface-300">{h.filename}</p>
                    <p className="text-xs text-surface-500">
                      {new Date(h.createdAt).toLocaleString()} • {t(EXPORT_PROFILE_KEYS[h.profile] ?? 'dataset.export.profile')} •{' '}
                      {t('dataset.export.historyMeta', {
                        records: h.recordCount,
                        images: h.imageCount,
                        size: formatBytes(h.bytes),
                      })}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void handleDownload(h)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {t('dataset.export.downloadAgain')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end border-t border-surface-200 pt-3 dark:border-surface-700">
          <Button
            type="button"
            variant="secondary"
            data-tour="export-close"
            onClick={() => {
              emitTourAction('export-close');
              onClose();
            }}
          >
            {t('common.close')}
          </Button>
        </div>

        {preview && preview.integrity.validationErrors > 0 && (
          <Alert variant="warning" title={t('dataset.export.validationErrors')}>
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {preview.integrity.validationErrors} error • {preview.integrity.validationWarnings} warning
            </span>
          </Alert>
        )}
      </div>
    </Modal>
  );
}
