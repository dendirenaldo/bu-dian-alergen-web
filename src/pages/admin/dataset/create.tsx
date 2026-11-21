import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminRoute from '@/components/shared/AdminRoute';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MenuSelect from '@/components/ui/MenuSelect';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { unwrapListApi } from '@/lib/unwrap';
import { useDatasetService } from '@/onboarding/useDatasetService';
import { emitTourAction } from '@/onboarding/types';
import { SIM_ALLERGENS } from '@/onboarding/simulation-data';
import { ALLERGEN_PRESENCE_KEYS, ALLERGEN_PRESENCES } from '@/lib/dataset-meta';
import type { Allergen, AllergenPresence, AllergenSeverity, CorrectedAllergenItem } from '@/types';
import { FlaskConical, ImagePlus, Plus, Trash2, X } from 'lucide-react';

interface Row {
  name: string;
  severity: AllergenSeverity;
  presence: AllergenPresence;
  confidence: string;
  evidence: string;
}

const SEVERITIES: AllergenSeverity[] = ['low', 'medium', 'high', 'critical'];

const emptyRow = (): Row => ({ name: '', severity: 'medium', presence: 'present', confidence: '0.9', evidence: '' });

export default function CreateDatasetPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const { token } = useAuth();
  const service = useDatasetService();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [normalized, setNormalized] = useState('');
  const [goldLabel, setGoldLabel] = useState<'safe' | 'unsafe'>('unsafe');
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState('');
  const [imageType, setImageType] = useState('ingredient_label');
  const [annotationSource, setAnnotationSource] = useState('human');
  const [exportEligible, setExportEligible] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [knownNames, setKnownNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (service.isSimulation) {
      setKnownNames(SIM_ALLERGENS);
      return;
    }
    let cancelled = false;
    api
      .get(API_ENDPOINTS.ALLERGENS.LIST, token ?? undefined)
      .then((res) => {
        if (cancelled) return;
        setKnownNames(unwrapListApi<Allergen>(res, 1, 1000).items.map((a) => a.name).filter(Boolean));
      })
      .catch(() => setKnownNames([]));
    return () => {
      cancelled = true;
    };
  }, [service.isSimulation, token]);

  const payload = useMemo(
    () => ({
      product_name: productName.trim() || undefined,
      brand: brand.trim() || undefined,
      category: category.trim() || undefined,
      barcode: barcode.trim() || undefined,
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
      annotation_source: annotationSource,
      export_eligible: exportEligible,
      acquisition_source: 'admin_manual',
    }),
    [
      annotationSource,
      barcode,
      brand,
      category,
      correctedText,
      exportEligible,
      goldLabel,
      imageType,
      ingredientText,
      normalized,
      notes,
      ocrText,
      productName,
      rows,
    ],
  );

  const save = async (status: 'draft' | 'pending_review') => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const created = await service.create({ ...payload, status, allow_incomplete: status === 'draft' });
      if (file) {
        try {
          await service.uploadImage(created.id, file, imageType);
        } catch (uploadErr: any) {
          // Record sudah tersimpan; jangan biarkan pengguna mengulang submit
          // dan membuat duplikat hanya karena gambar gagal.
          toast(uploadErr?.message ?? t('dataset.imageUploadFailed'), 'error');
          if (status === 'draft') emitTourAction('create-save-draft');
          void router.push(`/admin/dataset/${created.id}`);
          return;
        }
      }
      if (status === 'draft') emitTourAction('create-save-draft');
      toast(t('dataset.createSuccess'));
      void router.push(`/admin/dataset/${created.id}`);
    } catch (err: any) {
      const msg = err?.message ?? t('dataset.createFailed');
      setError(msg);
      const fields = err?.fieldErrors;
      if (fields && typeof fields === 'object') setFieldErrors(fields);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    emitTourAction('review-allergen-edit');
  };

  return (
    <AdminRoute>
      <SeoHead title={t('dataset.newTitle')} description={t('dataset.newSubtitle')} path="/admin/dataset/create" noIndex />
      <PageTransition>
        <div className="space-y-6 pb-24">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.dataset'), href: '/admin/dataset' }, { label: t('dataset.create') }]} />
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('dataset.newTitle')}</h1>
              {service.isSimulation && (
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {t('onboarding.simulationBadge')}
                </Badge>
              )}
            </div>
            <p className="max-w-2xl text-sm text-surface-500 dark:text-surface-400">{t('dataset.newSubtitle')}</p>
          </div>

          {error && (
            <Alert variant="error" title={t('dataset.createFailed')}>
              {error}
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card padding="md" data-tour="create-identity">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.form.identity')}</h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('dataset.form.identityDesc')}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div data-tour="create-product-name" className="sm:col-span-2">
                    <Input
                      label={`${t('dataset.field.productName')} (${t('dataset.field.required')})`}
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        emitTourAction('create-product-name');
                      }}
                      error={fieldErrors.product_name}
                      placeholder="cth: Biskuit Gandum Cokelat 120 g"
                    />
                  </div>
                  <Input label={t('dataset.field.brand')} value={brand} onChange={(e) => setBrand(e.target.value)} />
                  <Input label={t('dataset.field.category')} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="cth: Biskuit" />
                  <Input label={t('dataset.field.barcode')} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>
              </Card>

              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.form.content')}</h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('dataset.form.contentDesc')}</p>
                <div className="mt-4 space-y-4">
                  <Textarea
                    label={t('dataset.field.ocrText')}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    rows={4}
                    placeholder="Tempel hasil OCR mentah…"
                    error={fieldErrors.ocr_text}
                  />
                  <div data-tour="create-corrected-text">
                    <Textarea
                      label={`${t('dataset.field.correctedText')} (${t('dataset.field.required')})`}
                      value={correctedText}
                      onChange={(e) => {
                        setCorrectedText(e.target.value);
                        emitTourAction('create-ocr');
                      }}
                      rows={5}
                      placeholder="Perbaiki teks label di sini…"
                      error={fieldErrors.corrected_text}
                    />
                  </div>
                  <Textarea
                    label={t('dataset.field.ingredientText')}
                    value={ingredientText}
                    onChange={(e) => setIngredientText(e.target.value)}
                    rows={3}
                  />
                  <Input
                    label={t('dataset.field.normalizedIngredients')}
                    value={normalized}
                    onChange={(e) => setNormalized(e.target.value)}
                    placeholder="tepung terigu, gula, susu bubuk"
                  />
                </div>
              </Card>

              <Card padding="md" data-tour="create-annotation">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.form.annotation')}</h2>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('dataset.form.annotationDesc')}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    data-tour="create-allergen-add"
                    onClick={() => {
                      setRows((prev) => [...prev, emptyRow()]);
                      emitTourAction('create-allergen-add');
                    }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t('dataset.addAllergen')}
                  </Button>
                </div>

                <fieldset className="mt-4">
                  <legend className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('dataset.goldLabel')}</legend>
                  <div className="flex gap-4">
                    {(['safe', 'unsafe'] as const).map((v) => (
                      <label key={v} className="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                        <input type="radio" name="gold_label" value={v} checked={goldLabel === v} onChange={() => setGoldLabel(v)} className="h-4 w-4 accent-primary-600" />
                        {v === 'safe' ? t('result.safe') : t('result.unsafe')}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-4 space-y-3">
                  {rows.length === 0 && <p className="text-sm text-surface-500 dark:text-surface-400">{t('dataset.allergensEmpty')}</p>}
                  {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-surface-200 p-3 dark:border-surface-700 sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto]">
                      <Input
                        label={i === 0 ? t('dataset.allergenName') : ''}
                        value={r.name}
                        list="known-allergens"
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        placeholder={t('dataset.allergenNamePh')}
                      />
                      <MenuSelect
                        label={i === 0 ? t('dataset.severity') : ''}
                        value={r.severity}
                        onChange={(e) => updateRow(i, { severity: e.target.value as AllergenSeverity })}
                        options={SEVERITIES.map((s) => ({ value: s, label: s }))}
                      />
                      <MenuSelect
                        label={i === 0 ? t('dataset.presence') : ''}
                        value={r.presence}
                        onChange={(e) => updateRow(i, { presence: e.target.value as AllergenPresence })}
                        options={ALLERGEN_PRESENCES.map((p) => ({ value: p, label: t(ALLERGEN_PRESENCE_KEYS[p]) }))}
                      />
                      <Input
                        label={i === 0 ? t('dataset.confidence') : ''}
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={r.confidence}
                        onChange={(e) => updateRow(i, { confidence: e.target.value })}
                      />
                      <div className={i === 0 ? 'pt-7' : ''}>
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={t('dataset.remove')}
                          className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="sm:col-span-5">
                        <Input
                          label={t('dataset.evidence')}
                          value={r.evidence}
                          onChange={(e) => updateRow(i, { evidence: e.target.value })}
                          placeholder={t('dataset.evidencePh')}
                        />
                      </div>
                    </div>
                  ))}
                  <datalist id="known-allergens">
                    {knownNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.field.image')}</h2>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{t('dataset.image.hint')}</p>
                <div className="mt-3">
                  {previewUrl ? (
                    <div className="relative overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="" className="max-h-64 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="absolute right-2 top-2 rounded-full bg-surface-900/70 p-1 text-white"
                        aria-label={t('common.delete')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 py-8 dark:border-surface-600">
                      <ImagePlus className="h-8 w-8 text-surface-400" />
                      <p className="mt-2 text-xs text-surface-500">{t('dataset.image.none')}</p>
                    </div>
                  )}
                  <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border border-surface-200 px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800">
                    {previewUrl ? t('dataset.image.replace') : t('dataset.image.choose')}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <MenuSelect
                    label={t('dataset.field.imageType')}
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value)}
                    options={['front_packaging', 'ingredient_label', 'nutrition_label', 'allergen_warning', 'other'].map((v) => ({
                      value: v,
                      label: t(`dataset.imagetype.${v}`),
                    }))}
                  />
                </div>
              </Card>

              <Card padding="md">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t('dataset.form.metadata')}</h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('dataset.form.metadataDesc')}</p>
                <div className="mt-4 space-y-4">
                  <MenuSelect
                    label={t('dataset.field.annotationSource')}
                    value={annotationSource}
                    onChange={(e) => setAnnotationSource(e.target.value)}
                    options={[
                      { value: 'human', label: 'human' },
                      { value: 'model', label: 'model' },
                      { value: 'hybrid', label: 'hybrid' },
                      { value: 'import', label: 'import' },
                    ]}
                  />
                  <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                    <input type="checkbox" checked={exportEligible} onChange={(e) => setExportEligible(e.target.checked)} className="h-4 w-4 accent-primary-600" />
                    {t('dataset.field.exportEligible')}
                  </label>
                  <Textarea label={t('dataset.field.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('dataset.notesPh')} />
                </div>
              </Card>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-surface-800 dark:bg-surface-950/95 lg:pl-72">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <Link href="/admin/dataset" className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400">
                {t('common.cancel')}
              </Link>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  data-tour="create-save-draft"
                  isLoading={saving}
                  onClick={() => void save('draft')}
                >
                  {saving ? t('dataset.saving') : t('dataset.saveDraft')}
                </Button>
                <Button type="button" isLoading={saving} onClick={() => void save('pending_review')}>
                  {t('dataset.submitReview')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

CreateDatasetPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
