'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import { Allergen, AllergenSeverity, DatasetItem } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { unwrapListApi } from '@/lib/unwrap';
import { asArray } from '@/lib/json';
import { useLocale } from '@/contexts/LocaleContext';

export interface DatasetCorrectionPayload {
  corrected_text: string;
  gold_label: 'safe' | 'unsafe';
  corrected_allergens: Array<{ name: string; severity: AllergenSeverity; confidence: number }>;
  notes: string;
  status: 'draft' | 'verified';
}

interface Row {
  name: string;
  severity: AllergenSeverity;
  confidence: string;
}

interface DatasetCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DatasetItem | null;
  onSubmit: (payload: DatasetCorrectionPayload) => Promise<void>;
  isSaving?: boolean;
  serverError?: string | null;
}

const SEVERITIES: AllergenSeverity[] = ['low', 'medium', 'high', 'critical'];

function toRows(item: DatasetItem | null): Row[] {
  // correctedAllergens dapat berupa string LONGTEXT dari MariaDB — koersi dulu.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = asArray<any>(item?.correctedAllergens ?? item?.corrected_allergens ?? []);
  if (list.length > 0) {
    return list.map((a) => ({
      name: String(a?.name ?? ''),
      severity: (SEVERITIES as string[]).includes(String(a?.severity)) ? (a.severity as AllergenSeverity) : 'medium',
      confidence: String(a?.confidence ?? 0),
    }));
  }
  return [];
}

/** Diff kata sederhana: prefix/suffix sama, tengah ditandai hapus/tambah. */
function diffWords(original: string, corrected: string): Array<{ type: 'same' | 'del' | 'ins'; text: string }> {
  const a = String(original ?? '').split(/(\s+)/);
  const b = String(corrected ?? '').split(/(\s+)/);
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre += 1;
  let sufA = a.length - 1;
  let sufB = b.length - 1;
  while (sufA >= pre && sufB >= pre && a[sufA] === b[sufB]) {
    sufA -= 1;
    sufB -= 1;
  }
  const out: Array<{ type: 'same' | 'del' | 'ins'; text: string }> = [];
  for (let i = 0; i < pre; i += 1) out.push({ type: 'same', text: a[i] });
  const del = a.slice(pre, sufA + 1).join('');
  const ins = b.slice(pre, sufB + 1).join('');
  if (del) out.push({ type: 'del', text: del });
  if (ins) out.push({ type: 'ins', text: ins });
  for (let i = sufA + 1; i < a.length; i += 1) out.push({ type: 'same', text: a[i] });
  return out.filter((t) => t.text !== '');
}

export default function DatasetCorrectionModal({
  isOpen,
  onClose,
  item,
  onSubmit,
  isSaving = false,
  serverError,
}: DatasetCorrectionModalProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const [correctedText, setCorrectedText] = useState('');
  const [goldLabel, setGoldLabel] = useState<'safe' | 'unsafe'>('safe');
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'verified'>('draft');
  const [knownNames, setKnownNames] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setCorrectedText(String(item.correctedText ?? item.corrected_text ?? item.ocrText ?? item.ocr_text ?? ''));
    setGoldLabel(item.goldLabel ?? item.gold_label ?? 'safe');
    setRows(toRows(item));
    setNotes(String(item.notes ?? ''));
    setStatus(item.status ?? 'draft');
    setErrors({});
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen || !token) return;
    let cancelled = false;
    api
      .get(API_ENDPOINTS.ALLERGENS.LIST, token)
      .then((res) => {
        if (cancelled) return;
        const names = unwrapListApi<Allergen>(res, 1, 1000).items.map((a) => a.name).filter(Boolean);
        setKnownNames(names);
      })
      .catch(() => {
        if (!cancelled) setKnownNames([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const ocrOriginal = String(item?.ocrText ?? item?.ocr_text ?? '');

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!correctedText.trim()) {
      errs.corrected_text = t('admin.validation.required', { field: t('dataset.correctedText') });
    } else if (correctedText.trim().length > 5000) {
      errs.corrected_text = t('dataset.correctedTextMax', { max: 5000 });
    }
    if (notes.trim().length > 2000) {
      errs.notes = t('dataset.notesMax');
    }
    rows.forEach((r, i) => {
      const name = r.name.trim();
      if (!name) {
        errs[`allergen.${i}.name`] = t('dataset.allergenNameRequired');
      } else if (knownNames.length > 0 && !knownNames.includes(name)) {
        errs[`allergen.${i}.name`] = t('dataset.allergenUnknown', { name });
      }
      const c = Number(r.confidence);
      if (r.confidence.trim() === '' || !Number.isFinite(c) || c < 0 || c > 1) {
        errs[`allergen.${i}.confidence`] = t('dataset.confidenceRange');
      }
      if (!(SEVERITIES as string[]).includes(r.severity)) {
        errs[`allergen.${i}.severity`] = t('admin.validation.required', { field: t('dataset.severity') });
      }
    });
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    await onSubmit({
      corrected_text: correctedText.trim(),
      gold_label: goldLabel,
      corrected_allergens: rows.map((r) => ({
        name: r.name.trim(),
        severity: r.severity,
        confidence: Number(r.confidence),
      })),
      notes: notes.trim(),
      status,
    });
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('dataset.correctionTitle')}
      size="xl"
      className="max-w-3xl"
    >
      {serverError && (
        <div className="mb-4">
          <Alert variant="error" title={t('api.err.failed')}>
            {serverError}
          </Alert>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              {t('dataset.ocrOriginal')}
            </span>
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
              {ocrOriginal || '—'}
            </div>
          </div>
          <Textarea
            label={t('dataset.correctedText')}
            placeholder={t('dataset.correctedTextPh')}
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            error={errors.corrected_text}
            rows={6}
            required
          />
        </div>
        {ocrOriginal && correctedText && ocrOriginal.trim() !== correctedText.trim() && (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800">
            <p className="mb-1.5 text-xs text-surface-500 dark:text-surface-400">{t('dataset.diffHint')}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-700 dark:text-surface-300" aria-live="polite">
              {diffWords(ocrOriginal, correctedText).map((tok, idx) =>
                tok.type === 'same' ? (
                  <span key={idx}>{tok.text}</span>
                ) : tok.type === 'del' ? (
                  <del key={idx} className="rounded bg-red-100 px-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {tok.text}
                  </del>
                ) : (
                  <ins key={idx} className="rounded bg-green-100 px-0.5 text-green-700 no-underline dark:bg-green-900/30 dark:text-green-300">
                    {tok.text}
                  </ins>
                ),
              )}
            </p>
          </div>
        )}

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            {t('dataset.goldLabel')}
          </legend>
          <div className="flex gap-4">
            {(['safe', 'unsafe'] as const).map((v) => (
              <label key={v} className="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                <input
                  type="radio"
                  name="gold_label"
                  value={v}
                  checked={goldLabel === v}
                  onChange={() => setGoldLabel(v)}
                  className="h-4 w-4 accent-primary-600"
                />
                {v === 'safe' ? t('result.safe') : t('result.unsafe')}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              {t('dataset.allergens')}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setRows((prev) => [...prev, { name: '', severity: 'medium', confidence: '0.9' }])}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('dataset.addAllergen')}
            </Button>
          </div>
          {rows.length === 0 && (
            <p className="text-sm text-surface-500 dark:text-surface-400">—</p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-surface-200 p-3 dark:border-surface-700 sm:grid-cols-[1fr_130px_110px_auto]">
              <div>
                <Input
                  label={i === 0 ? t('dataset.allergenName') : ''}
                  placeholder={t('dataset.allergenNamePh')}
                  value={r.name}
                  list="dataset-allergen-names"
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  error={errors[`allergen.${i}.name`]}
                />
              </div>
              <Select
                label={i === 0 ? t('dataset.severity') : ''}
                value={r.severity}
                onChange={(e) => updateRow(i, { severity: e.target.value as AllergenSeverity })}
                options={SEVERITIES.map((s) => ({ value: s, label: s }))}
              />
              <Input
                label={i === 0 ? t('dataset.confidence') : ''}
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={r.confidence}
                onChange={(e) => updateRow(i, { confidence: e.target.value })}
                error={errors[`allergen.${i}.confidence`]}
              />
              <div className={i === 0 ? 'pt-7' : ''}>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={t('dataset.remove')}
                  title={t('dataset.remove')}
                  className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {errors[`allergen.${i}.severity`] && (
                <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-4">{errors[`allergen.${i}.severity`]}</p>
              )}
            </div>
          ))}
          <datalist id="dataset-allergen-names">
            {knownNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <Textarea
          label={t('dataset.notes')}
          placeholder={t('dataset.notesPh')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
          rows={2}
        />
        <div className="max-w-xs">
          <Select
            label={t('dataset.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'verified')}
            options={[
              { value: 'draft', label: t('dataset.statusDraft') },
              { value: 'verified', label: t('dataset.statusVerified') },
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {t('dataset.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
