import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminRoute from '@/components/shared/AdminRoute';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MenuSelect from '@/components/ui/MenuSelect';
import DetailSkeleton from '@/components/ui/DetailSkeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/contexts/ToastContext';
import { useDatasetService, type DatasetReviewAction } from '@/onboarding/useDatasetService';
import { emitTourAction } from '@/onboarding/types';
import { SIM_ALLERGENS } from '@/onboarding/simulation-data';
import {
  ALLERGEN_PRESENCE_KEYS,
  ALLERGEN_PRESENCES,
  ACQUISITION_SOURCE_KEYS,
  DATASET_SOURCE_KEYS,
  REVIEW_ACTIONS,
  REVIEW_ACTION_KEYS,
  datasetQualityKey,
  datasetQualityVariant,
  datasetStatusKey,
  datasetStatusVariant,
  mediaUrl,
} from '@/lib/dataset-meta';
import type { AllergenPresence, AllergenSeverity, CorrectedAllergenItem, DatasetAuditEntry, DatasetItem } from '@/types';
import { FlaskConical, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';

interface Row {
  name: string;
  severity: AllergenSeverity;
  presence: AllergenPresence;
  confidence: string;
  evidence: string;
}

const SEVERITIES: AllergenSeverity[] = ['low', 'medium', 'high', 'critical'];

function rowsOf(item: DatasetItem | null): Row[] {
  return (item?.correctedAllergens ?? []).map((a) => ({
    name: a.name,
    severity: a.severity,
    presence: (a.presence ?? 'present') as AllergenPresence,
    confidence: String(a.confidence ?? 0),
    evidence: a.evidence ?? '',
  }));
}

export default function DatasetDetailPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const service = useDatasetService();
  const idParam = router.query.id;
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam);

  const [item, setItem] = useState<DatasetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [dirty, setDirty] = useState(false);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [normalized, setNormalized] = useState('');
  const [goldLabel, setGoldLabel] = useState<'safe' | 'unsafe'>('safe');
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState('');
  const [imageType, setImageType] = useState('ingredient_label');
  const [exportEligible, setExportEligible] = useState(true);
  const [knownNames, setKnownNames] = useState<string[]>(SIM_ALLERGENS);
  const [history, setHistory] = useState<DatasetAuditEntry[]>([]);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await service.get(id);
      setItem(data);
      setProductName(data.productName ?? data.detection?.product?.name ?? '');
      setBrand(data.brand ?? '');
      setCategory(data.category ?? '');
      setOcrText(data.ocrText ?? '');
      setCorrectedText(data.correctedText ?? '');
      setIngredientText(data.ingredientText ?? '');
      setNormalized((data.normalizedIngredients ?? []).join(', '));
      setGoldLabel(data.goldLabel ?? 'safe');
      setRows(rowsOf(data));
      setNotes(data.notes ?? '');
      setImageType(data.imageType ?? 'ingredient_label');
      setExportEligible(data.exportEligible !== false);
      setDirty(false);
      void service.history(data).then(setHistory).catch(() => setHistory([]));
    } catch (err: any) {
      setError(err?.message ?? t('api.err.loadFail'));
    } finally {
      setLoading(false);
    }
  }, [id, service, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const issues = item?.validationErrors ?? [];
  const actions = useMemo(() => {
    if (!item) return [] as DatasetReviewAction[];
    return (REVIEW_ACTIONS[item.status] ?? []) as DatasetReviewAction[];
  }, [item]);

  const markDirty = () => setDirty(true);

  const save = async () => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await service.update(item.id, {
        product_name: productName.trim() || undefined,
        brand: brand.trim() || undefined,
        category: category.trim() || undefined,
        ocr_text: ocrText.trim() || undefined,
        corrected_text: correctedText.trim() || undefined,
        ingredient_text: ingredientText.trim() || undefined,
        normalized_ingredients: normalized
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        gold_label: goldLabel,
        corrected_allergens: rows
          .filter((r) => r.name.trim())
          .map<CorrectedAllergenItem>((r) => ({
            name: r.name.trim(),
            severity: r.severity,
            presence: r.presence,
            confidence: Number(r.confidence) || 0,
            ...(r.evidence.trim() ? { evidence: r.evidence.trim() } : {}),
          })),
        notes: notes.trim() || undefined,
        image_type: imageType,
        export_eligible: exportEligible,
        expected_updated_at: item.updatedAt,
      });
      setItem(updated);
      setDirty(false);
      emitTourAction('review-save');
      toast(t('toast.updated'));
    } catch (err: any) {
      setError(err?.message ?? t('toast.failed'));
      toast(err?.message ?? t('toast.failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const applyReview = async (action: DatasetReviewAction) => {
    if (!item) return;
    if ((action === 'reject' || action === 'request_correction') && !note.trim()) {
      setError(t('dataset.noteRequired'));
      return;
    }
    setActing(action);
    setError(null);
    try {
      const updated = await service.review(item.id, action, note.trim() || undefined, item.updatedAt);
      setItem(updated);
      setNote('');
      if (action === 'approve') emitTourAction('review-approve');
      toast(t('dataset.reviewSuccess'));
    } catch (err: any) {
      setError(err?.message ?? t('dataset.reviewFailed'));
      toast(err?.message ?? t('dataset.reviewFailed'), 'error');
    } finally {
      setActing(null);
    }
  };

  const upload = async (file: File) => {
    if (!item) return;
    try {
      const updated = await service.uploadImage(item.id, file, imageType);
      setItem(updated);
      toast(t('toast.updated'));
    } catch (err: any) {
      setError(err?.message ?? t('toast.failed'));
    }
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    markDirty();
    emitTourAction('review-allergen-edit');
  };

  if (loading) {
    return (
      <AdminRoute>
        <PageTransition>
          <DetailSkeleton />
        </PageTransition>
      </AdminRoute>
    );
  }

  if (!item) {
    return (
      <AdminRoute>
        <PageTransition>
          <div className="space-y-4">
            <Breadcrumb items={[{ label: t('admin.dataset'), href: '/admin/dataset' }, { label: t('dataset.detailTitle') }]} />
            <Alert variant="error" title={t('api.err.notFound')}>{error ?? t('api.err.notFound')}</Alert>
            <Link href="/admin/dataset" className="text-sm text-primary-600 hover:text-primary-700">{t('dataset.backToList')}</Link>
          </div>
        </PageTransition>
      </AdminRoute>
    );
  }

  const img = mediaUrl(item.imageUrl ?? item.detection?.imageUrl ?? null);

  return (
    <AdminRoute>
      <SeoHead title={t('dataset.detailTitle')} description={t('admin.pageDesc.dataset')} path={`/admin/dataset/${item.id}`} noIndex />
      <PageTransition>
        <div className="space-y-6 pb-10">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.dataset'), href: '/admin/dataset' }, { label: `#${item.id}` }]} />
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{productName || t('dataset.detailTitle')}</h1>
              <Badge variant={datasetStatusVariant(item.status)}>{t(datasetStatusKey(item.status))}</Badge>
              <Badge variant={datasetQualityVariant(item.qualityStatus)}>{t(datasetQualityKey(item.qualityStatus))}</Badge>
              {item.isSimulation && (
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {t('onboarding.simulationBadge')}
                </Badge>
              )}
              {item.duplicateOf != null && <Badge variant="warning">duplikat #{item.duplicateOf}</Badge>}
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {[brand, category, item.barcode].filter(Boolean).join(' • ') || '—'} • {t('dataset.updatedAt')} {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
            </p>
            <Link href="/admin/dataset" className="inline-block text-sm text-primary-600 hover:text-primary-700">
              ← {t('dataset.backToList')}
            </Link>
          </div>

          {error && <Alert variant="error" title={t('dataset.reviewFailed')} onClose={() => setError(null)}>{error}</Alert>}

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card padding="md">
                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <div>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={productName} className="max-h-64 w-full rounded-xl border border-surface-200 object-contain dark:border-surface-700" />
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 text-xs text-surface-500 dark:border-surface-600">
                        <ImagePlus className="mb-1 h-6 w-6" />
                        {t('dataset.noImage')}
                      </div>
                    )}
                    <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800">
                      {t('dataset.image.replace')}
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
                    </label>
                    <p className="mt-2 text-[11px] text-surface-500">
                      {item.imageWidth && item.imageHeight ? `${item.imageWidth}×${item.imageHeight} px` : '—'}
                      {item.imageMime ? ` • ${item.imageMime}` : ''}
                      {item.imageSize ? ` • ${(item.imageSize / 1024).toFixed(0)} KB` : ''}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={t('dataset.field.productName')} value={productName} onChange={(e) => { setProductName(e.target.value); markDirty(); }} />
                    <Input label={t('dataset.field.brand')} value={brand} onChange={(e) => { setBrand(e.target.value); markDirty(); }} />
                    <Input label={t('dataset.field.category')} value={category} onChange={(e) => { setCategory(e.target.value); markDirty(); }} />
                    <MenuSelect
                      label={t('dataset.field.imageType')}
                      value={imageType}
                      onChange={(e) => { setImageType(e.target.value); markDirty(); }}
                      options={['front_packaging', 'ingredient_label', 'nutrition_label', 'allergen_warning', 'other'].map((v) => ({
                        value: v,
                        label: t(`dataset.imagetype.${v}`),
                      }))}
                    />
                  </div>
                </div>
              </Card>

              <Card padding="md" data-tour="review-ocr">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.ocrCompare')}</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">{t('dataset.ocrOriginal')}</p>
                    <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
                      {ocrText || '—'}
                    </div>
                    <Textarea
                      label={t('dataset.field.ocrText')}
                      value={ocrText}
                      onChange={(e) => { setOcrText(e.target.value); markDirty(); }}
                      rows={4}
                    />
                  </div>
                  <Textarea
                    label={t('dataset.field.correctedText')}
                    value={correctedText}
                    onChange={(e) => { setCorrectedText(e.target.value); markDirty(); }}
                    rows={12}
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Textarea label={t('dataset.field.ingredientText')} value={ingredientText} onChange={(e) => { setIngredientText(e.target.value); markDirty(); }} rows={3} />
                  <Input
                    label={t('dataset.field.normalizedIngredients')}
                    value={normalized}
                    onChange={(e) => { setNormalized(e.target.value); markDirty(); }}
                  />
                </div>
              </Card>

              <Card padding="md" data-tour="review-allergens">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.form.annotation')}</h2>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('dataset.form.annotationDesc')}</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setRows((p) => [...p, { name: '', severity: 'medium', presence: 'present', confidence: '0.9', evidence: '' }]); markDirty(); }}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t('dataset.addAllergen')}
                  </Button>
                </div>
                <fieldset className="mt-4">
                  <legend className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('dataset.goldLabel')}</legend>
                  <div className="flex gap-4">
                    {(['safe', 'unsafe'] as const).map((v) => (
                      <label key={v} className="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                        <input type="radio" name="detail-gold" value={v} checked={goldLabel === v} onChange={() => { setGoldLabel(v); markDirty(); }} className="h-4 w-4 accent-primary-600" />
                        {v === 'safe' ? t('result.safe') : t('result.unsafe')}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-4 space-y-3">
                  {rows.length === 0 && <p className="text-sm text-surface-500 dark:text-surface-400">{t('dataset.allergensEmpty')}</p>}
                  {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-surface-200 p-3 dark:border-surface-700 sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto]">
                      <Input label={i === 0 ? t('dataset.allergenName') : ''} value={r.name} list="detail-allergens" onChange={(e) => updateRow(i, { name: e.target.value })} />
                      <MenuSelect label={i === 0 ? t('dataset.severity') : ''} value={r.severity} onChange={(e) => updateRow(i, { severity: e.target.value as AllergenSeverity })} options={SEVERITIES.map((s) => ({ value: s, label: s }))} />
                      <MenuSelect label={i === 0 ? t('dataset.presence') : ''} value={r.presence} onChange={(e) => updateRow(i, { presence: e.target.value as AllergenPresence })} options={ALLERGEN_PRESENCES.map((p) => ({ value: p, label: t(ALLERGEN_PRESENCE_KEYS[p]) }))} />
                      <Input label={i === 0 ? t('dataset.confidence') : ''} type="number" min={0} max={1} step={0.01} value={r.confidence} onChange={(e) => updateRow(i, { confidence: e.target.value })} />
                      <div className={i === 0 ? 'pt-7' : ''}>
                        <button type="button" onClick={() => { setRows((p) => p.filter((_, idx) => idx !== i)); markDirty(); }} aria-label={t('dataset.remove')} className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="sm:col-span-5">
                        <Input label={t('dataset.evidence')} value={r.evidence} onChange={(e) => updateRow(i, { evidence: e.target.value })} placeholder={t('dataset.evidencePh')} />
                      </div>
                    </div>
                  ))}
                  <datalist id="detail-allergens">
                    {(knownNames.length ? knownNames : SIM_ALLERGENS).map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" data-tour="review-save" isLoading={saving} onClick={() => void save()} disabled={!dirty && !saving}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {t('common.save')}
                  </Button>
                  {dirty && <span className="text-xs text-amber-600 dark:text-amber-400">{t('dataset.saving')}</span>}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card padding="md" data-tour="review-validation">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.validation')}</h2>
                {issues.length === 0 ? (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t('dataset.validationEmpty')}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {issues.map((issue, i) => (
                      <li key={`${issue.code}-${i}`} className="rounded-lg border border-surface-200 p-2 text-sm dark:border-surface-700">
                        <div className="flex items-start gap-2">
                          <Badge variant={issue.severity === 'error' ? 'danger' : 'warning'}>{issue.severity}</Badge>
                          <span className="text-surface-700 dark:text-surface-300">{issue.message}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-surface-400">{issue.code} • {issue.field}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-surface-500 dark:text-surface-400">{t('dataset.form.annotationDesc')}</p>
              </Card>

              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.review')}</h2>
                <div className="mt-3">
                  <Textarea label={t('dataset.reviewerNote')} value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('dataset.reviewerNotePh')} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((action) => {
                    const danger = action === 'reject';
                    const primary = action === 'approve' || action === 'verify' || action === 'submit';
                    return (
                      <Button
                        key={action}
                        type="button"
                        size="sm"
                        variant={danger ? 'danger' : primary ? 'primary' : 'secondary'}
                        isLoading={acting === action}
                        data-tour={action === 'approve' ? 'review-approve' : undefined}
                        onClick={() => void applyReview(action)}
                      >
                        {t(REVIEW_ACTION_KEYS[action] ?? action)}
                      </Button>
                    );
                  })}
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                  <input
                    type="checkbox"
                    checked={exportEligible}
                    onChange={(e) => { setExportEligible(e.target.checked); markDirty(); }}
                    className="h-4 w-4 accent-primary-600"
                  />
                  {t('dataset.field.exportEligible')}
                </label>
                <Textarea label={t('dataset.field.notes')} value={notes} onChange={(e) => { setNotes(e.target.value); markDirty(); }} rows={3} />
              </Card>

              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.history')}</h2>
                {history.length === 0 ? (
                  <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">{t('dataset.historyEmpty')}</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {history.slice(0, 12).map((h) => (
                      <li key={h.id} className="flex items-start justify-between gap-3 border-b border-surface-100 pb-2 last:border-0 dark:border-surface-800">
                        <div>
                          <p className="font-mono text-xs text-surface-700 dark:text-surface-300">{h.action}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">
                            {h.actorId ? `actor #${h.actorId}` : 'sistem'}
                            {h.meta?.status ? ` • ${t(datasetStatusKey(String(h.meta.status)))}` : ''}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-surface-400">{new Date(h.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.metadata')}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    [t('dataset.status'), t(datasetStatusKey(item.status))],
                    [t('dataset.quality'), t(datasetQualityKey(item.qualityStatus))],
                    ['source', item.source ? t(DATASET_SOURCE_KEYS[item.source] ?? item.source) : '—'],
                    ['acquisition', item.acquisitionSource ? t(ACQUISITION_SOURCE_KEYS[item.acquisitionSource] ?? item.acquisitionSource) : '—'],
                    ['annotation', item.annotationSource ?? '—'],
                    ['OCR', `${item.ocrEngine ?? '—'} ${item.ocrEngineVersion ?? ''} • ${item.ocrStatus ?? '—'}`],
                    [t('dataset.createdAt'), new Date(item.createdAt).toLocaleString()],
                    [t('dataset.updatedAt'), item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'],
                    [t('dataset.submittedBy'), item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'],
                    [t('dataset.reviewedBy'), item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : '—'],
                    [t('dataset.verifiedBy'), item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : '—'],
                    [t('dataset.checksum'), item.imageChecksum ? `${item.imageChecksum.slice(0, 16)}…` : '—'],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between gap-3">
                      <dt className="text-surface-500 dark:text-surface-400">{label}</dt>
                      <dd className="text-right text-surface-700 dark:text-surface-300">{value}</dd>
                    </div>
                  ))}
                </dl>
                {item.reviewNote && (
                  <p className="mt-3 rounded-lg bg-surface-50 p-2 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                    {item.reviewNote}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

DatasetDetailPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
