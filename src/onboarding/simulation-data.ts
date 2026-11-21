import type {
  CorrectedAllergenItem,
  DatasetExportPreview,
  DatasetExportRecord,
  DatasetItem,
  DatasetSplitInfo,
  DatasetStatistics,
} from '@/types';

/**
 * Data simulasi onboarding. Seluruh record ber-ID negatif dan ditandai
 * `isSimulation` agar tidak pernah tertukar dengan data produksi.
 */

export const SIM_ALLERGENS = ['Gluten (gandum)', 'Susu', 'Telur', 'Kacang tanah', 'Kedelai', 'Udang'];

function allergen(
  name: string,
  severity: CorrectedAllergenItem['severity'],
  confidence: number,
  presence: CorrectedAllergenItem['presence'] = 'present',
): CorrectedAllergenItem {
  return { name, severity, confidence, presence };
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

export function createSimDatasetRecords(): DatasetItem[] {
  return [
    {
      id: -101,
      detectionId: -201,
      source: 'manual',
      acquisitionSource: 'admin_manual',
      productName: 'Biskuit Gandum Cokelat',
      brand: 'Simulation Bakery',
      category: 'Biskuit',
      barcode: '8990000000101',
      ocrText:
        'BISKUIT GANDUM COKELAT\nKomposisi: tepung gandum, gula, minyak nabati, susu bubuk, kakao, garam.\nMengandung alergen: gandum, susu.',
      correctedText:
        'BISKUIT GANDUM COKELAT\nKomposisi: tepung gandum, gula, minyak nabati, susu bubuk, kakao, garam.\nMengandung alergen: gandum, susu.',
      ingredientText: 'tepung gandum, gula, minyak nabati, susu bubuk, kakao, garam',
      normalizedIngredients: ['tepung gandum', 'gula', 'minyak nabati', 'susu bubuk', 'kakao', 'garam'],
      goldLabel: 'unsafe',
      correctedAllergens: [allergen('Gluten (gandum)', 'high', 0.96), allergen('Susu', 'medium', 0.88)],
      status: 'approved',
      qualityStatus: 'ok',
      validationErrors: null,
      exportEligible: true,
      annotationSource: 'human',
      annotationVersion: '1',
      imageType: 'ingredient_label',
      ocrStatus: 'corrected',
      ocrEngine: 'tesseract',
      notes: 'Data simulasi untuk panduan.',
      isSimulation: true,
      createdAt: daysAgo(9),
      updatedAt: daysAgo(2),
    },
    {
      id: -102,
      detectionId: -202,
      source: 'manual',
      acquisitionSource: 'admin_manual',
      productName: 'Mi Instan Rasa Ayam',
      brand: 'Simulation Foods',
      category: 'Makanan Instan',
      ocrText:
        'MI INSTAN RASA AYAM\nKomposisi: tepung terigu, minyak sawit, garam, bumbu ayam, kedelai, bawang putih.',
      correctedText:
        'MI INSTAN RASA AYAM\nKomposisi: tepung terigu, minyak sawit, garam, bumbu ayam, kedelai, bawang putih.',
      ingredientText: 'tepung terigu, minyak sawit, garam, bumbu ayam, kedelai, bawang putih',
      normalizedIngredients: ['tepung terigu', 'minyak sawit', 'garam', 'bumbu ayam', 'kedelai', 'bawang putih'],
      goldLabel: 'unsafe',
      correctedAllergens: [allergen('Gluten (gandum)', 'high', 0.94), allergen('Kedelai', 'medium', 0.8)],
      status: 'pending_review',
      qualityStatus: 'warning',
      validationErrors: [
        { code: 'MISSING_IMAGE', field: 'image', severity: 'warning', message: 'Belum ada gambar label.' },
      ],
      exportEligible: true,
      annotationSource: 'human',
      annotationVersion: '1',
      ocrStatus: 'processed',
      notes: null,
      isSimulation: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      id: -103,
      detectionId: -203,
      source: 'detection',
      acquisitionSource: 'detection_promotion',
      productName: 'Susu UHT Cokelat',
      brand: 'Simulation Dairy',
      category: 'Minuman',
      ocrText: 'SUSU UHT COKELAT\nKomposisi: susu segar, gula, kakao, perisa cokelat.',
      correctedText: 'SUSU UHT COKELAT\nKomposisi: susu segar, gula, kakao, perisa cokelat.',
      ingredientText: 'susu segar, gula, kakao, perisa cokelat',
      normalizedIngredients: ['susu segar', 'gula', 'kakao', 'perisa cokelat'],
      goldLabel: 'unsafe',
      correctedAllergens: [allergen('Susu', 'high', 0.97)],
      status: 'needs_correction',
      qualityStatus: 'error',
      validationErrors: [
        {
          code: 'LABEL_CONFLICT',
          field: 'gold_label',
          severity: 'error',
          message: 'Label aman bertentangan dengan alergen positif: Susu.',
        },
      ],
      exportEligible: false,
      annotationSource: 'model',
      annotationVersion: '1',
      ocrStatus: 'processed',
      reviewNote: 'Mohon periksa ulang label dan anotasi.',
      isSimulation: true,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      id: -104,
      detectionId: null,
      source: 'manual',
      acquisitionSource: 'admin_manual',
      productName: 'Keripik Kentang Original',
      brand: 'Simulation Snack',
      category: 'Snack',
      ocrText: 'KERIPIK KENTANG\nKomposisi: kentang, minyak nabati, garam.',
      correctedText: 'KERIPIK KENTANG\nKomposisi: kentang, minyak nabati, garam.',
      ingredientText: 'kentang, minyak nabati, garam',
      normalizedIngredients: ['kentang', 'minyak nabati', 'garam'],
      goldLabel: 'safe',
      correctedAllergens: [],
      status: 'draft',
      qualityStatus: 'warning',
      validationErrors: [
        {
          code: 'MISSING_ANNOTATION',
          field: 'corrected_allergens',
          severity: 'warning',
          message: 'Anotasi alergen belum diisi.',
        },
      ],
      exportEligible: true,
      annotationSource: 'human',
      annotationVersion: '1',
      ocrStatus: 'corrected',
      notes: null,
      isSimulation: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
  ];
}

export function simText(item: DatasetItem): string {
  return String(item.correctedText ?? item.ocrText ?? '');
}

export function simLabelSet(item: DatasetItem): string[] {
  const labels = new Set<string>([item.goldLabel]);
  for (const a of item.correctedAllergens ?? []) {
    if (!['present', 'may_contain', 'cross_contamination'].includes(a.presence ?? 'present')) continue;
    labels.add(`allergen_${slug(a.name)}`);
  }
  return [...labels].sort();
}

function slug(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function computeSimStatistics(records: DatasetItem[]): DatasetStatistics {
  const statusCounts: Record<string, number> = {};
  const qualityCounts: Record<string, number> = {};
  const labelCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const acquisitionCounts: Record<string, number> = {};
  const allergenMap = new Map<string, number>();
  const growthMap = new Map<string, number>();
  let missingImage = 0;
  let missingText = 0;
  let duplicates = 0;
  let ocrFailed = 0;
  let exportable = 0;

  for (const r of records) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    qualityCounts[r.qualityStatus ?? 'unassessed'] = (qualityCounts[r.qualityStatus ?? 'unassessed'] ?? 0) + 1;
    labelCounts[r.goldLabel] = (labelCounts[r.goldLabel] ?? 0) + 1;
    const src = r.source ?? 'manual';
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    const acq = r.acquisitionSource ?? 'admin_manual';
    acquisitionCounts[acq] = (acquisitionCounts[acq] ?? 0) + 1;
    for (const a of r.correctedAllergens ?? []) {
      allergenMap.set(a.name, (allergenMap.get(a.name) ?? 0) + 1);
    }
    if (!r.imageUrl) missingImage += 1;
    if (!simText(r).trim()) missingText += 1;
    if (r.duplicateOf) duplicates += 1;
    if (r.ocrStatus === 'failed') ocrFailed += 1;
    if (r.exportEligible !== false && ['verified', 'approved'].includes(r.status) && simText(r).trim()) {
      exportable += 1;
    }
    const created = r.createdAt ? new Date(r.createdAt) : null;
    if (created && now - created.getTime() <= 14 * 86400000) {
      const key = created.toISOString().slice(0, 10);
      growthMap.set(key, (growthMap.get(key) ?? 0) + 1);
    }
  }

  const growth: Array<{ date: string; count: number }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    growth.push({ date: key, count: growthMap.get(key) ?? 0 });
  }

  return {
    totals: {
      total: records.length,
      awaitingReview: statusCounts.pending_review ?? 0,
      needsCorrection: statusCounts.needs_correction ?? 0,
      verified: statusCounts.verified ?? 0,
      approved: statusCounts.approved ?? 0,
      rejected: statusCounts.rejected ?? 0,
      draft: statusCounts.draft ?? 0,
      archived: statusCounts.archived ?? 0,
      exportable,
      missingImage,
      missingText,
      duplicates,
      ocrFailed,
      qualityError: qualityCounts.error ?? 0,
      qualityWarning: qualityCounts.warning ?? 0,
      qualityOk: qualityCounts.ok ?? 0,
    },
    statusCounts,
    qualityCounts,
    labelCounts,
    sourceCounts,
    acquisitionCounts,
    allergenDistribution: [...allergenMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    growth,
    generatedAt: new Date().toISOString(),
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function simSplit(records: DatasetItem[], seed = 42, ratios = { train: 0.7, validation: 0.15, test: 0.15 }): DatasetSplitInfo {
  const groups = new Map<string, number[]>();
  for (const r of records) {
    const key = r.detectionId != null ? `d:${r.detectionId}` : `i:${r.id}`;
    const list = groups.get(key) ?? [];
    list.push(r.id);
    groups.set(key, list);
  }
  const order = seededShuffle([...groups.values()], seed);
  const total = records.length;
  const trainTarget = Math.floor(total * ratios.train);
  const valTarget = Math.floor(total * ratios.validation);
  const splits = { train: [] as number[], validation: [] as number[], test: [] as number[] };
  for (const group of order) {
    const target =
      splits.train.length + group.length <= trainTarget
        ? 'train'
        : splits.validation.length + group.length <= valTarget
          ? 'validation'
          : 'test';
    splits[target].push(...group);
  }
  const labelDistribution: Record<string, { train: number; validation: number; test: number }> = {};
  const byId = new Map(records.map((r) => [r.id, r]));
  for (const name of ['train', 'validation', 'test'] as const) {
    for (const id of splits[name]) {
      for (const label of simLabelSet(byId.get(id)!)) {
        labelDistribution[label] = labelDistribution[label] ?? { train: 0, validation: 0, test: 0 };
        labelDistribution[label][name] += 1;
      }
    }
  }
  return {
    seed,
    ratios,
    strategy: 'multilabel',
    groupBy: 'detection',
    splits,
    counts: {
      train: splits.train.length,
      validation: splits.validation.length,
      test: splits.test.length,
      total,
    },
    groupCount: groups.size,
    audit: [
      { comparison: 'group train/val', overlap: 0, status: 'PASS' },
      { comparison: 'group train/test', overlap: 0, status: 'PASS' },
      { comparison: 'group val/test', overlap: 0, status: 'PASS' },
      { comparison: 'exact-text train/val', overlap: 0, status: 'PASS' },
      { comparison: 'exact-text train/test', overlap: 0, status: 'PASS' },
      { comparison: 'exact-text val/test', overlap: 0, status: 'PASS' },
    ],
    labelDistribution,
    duplicateGroupCount: 0,
  };
}

export interface SimExportConfig {
  profile: 'raw' | 'nlp' | 'image_classification' | 'multimodal';
  format: 'jsonl' | 'csv' | 'json';
  status?: string;
  label?: string;
  includeImages?: boolean;
  includeSplits?: boolean;
  seed?: number;
  trainRatio?: number;
  validationRatio?: number;
  testRatio?: number;
}

export function computeSimPreview(records: DatasetItem[], config: SimExportConfig): DatasetExportPreview {
  const statuses = (config.status ?? 'verified,approved').split(',').filter(Boolean);
  const selected = records.filter(
    (r) =>
      statuses.includes(r.status) &&
      (!config.label || r.goldLabel === config.label),
  );
  const eligible: DatasetItem[] = [];
  const excluded: Array<{ id: number; reason: string }> = [];
  for (const r of selected) {
    if (r.exportEligible === false) {
      excluded.push({ id: r.id, reason: 'export_eligible_false' });
      continue;
    }
    if (!simText(r).trim()) {
      excluded.push({ id: r.id, reason: 'empty_text' });
      continue;
    }
    if (config.profile === 'image_classification' && config.includeImages !== false && !r.imageUrl) {
      excluded.push({ id: r.id, reason: 'missing_image' });
      continue;
    }
    eligible.push(r);
  }
  const labelDistribution: Record<string, number> = { safe: 0, unsafe: 0 };
  const allergenMap = new Map<string, number>();
  for (const r of eligible) {
    labelDistribution[r.goldLabel] = (labelDistribution[r.goldLabel] ?? 0) + 1;
    for (const a of r.correctedAllergens ?? []) {
      if (!['present', 'may_contain', 'cross_contamination'].includes(a.presence ?? 'present')) continue;
      allergenMap.set(a.name, (allergenMap.get(a.name) ?? 0) + 1);
      labelDistribution[`allergen_${slug(a.name)}`] = (labelDistribution[`allergen_${slug(a.name)}`] ?? 0) + 1;
    }
  }
  const split = eligible.length
    ? simSplit(eligible, config.seed ?? 42, {
        train: config.trainRatio ?? 0.7,
        validation: config.validationRatio ?? 0.15,
        test: config.testRatio ?? 0.15,
      })
    : null;
  const warnings = excluded.length
    ? [{ code: 'EXCLUDED_RECORDS', message: `${excluded.length} record dikecualikan.` }]
    : [];
  return {
    profile: config.profile,
    format: config.format,
    filters: { status: statuses },
    counts: {
      selected: selected.length,
      eligible: eligible.length,
      excluded: excluded.length,
      images: eligible.filter((r) => !!r.imageUrl).length,
      missingImages: eligible.filter((r) => !r.imageUrl).length,
      labels: {
        safe: labelDistribution.safe ?? 0,
        unsafe: labelDistribution.unsafe ?? 0,
      },
    },
    labelDistribution,
    allergenDistribution: [...allergenMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    split,
    excluded,
    warnings,
    integrity: {
      duplicateIds: 0,
      missingImages: eligible.filter((r) => !r.imageUrl).length,
      validationErrors: eligible.filter((r) => r.qualityStatus === 'error').length,
      validationWarnings: eligible.filter((r) => r.qualityStatus === 'warning').length,
      auditPassed: true,
      missingText: 0,
    },
    estimatedBytes: eligible.reduce((n, r) => n + simText(r).length + 512, 4096),
  };
}

export function createSimExportRecord(
  records: DatasetItem[],
  config: SimExportConfig,
  index: number,
): DatasetExportRecord {
  const preview = computeSimPreview(records, config);
  return {
    id: -900 - index,
    exportId: `exp_sim_${String(index).padStart(3, '0')}`,
    profile: config.profile,
    format: config.format,
    status: 'completed',
    recordCount: preview.counts.eligible,
    imageCount: preview.counts.images,
    bytes: preview.estimatedBytes,
    filename: `dataset_${config.profile}_simulation_${index}.zip`,
    checksum: '0'.repeat(64),
    config: { ...config },
    warnings: preview.warnings,
    excluded: preview.excluded,
    manifest: {
      export_id: `exp_sim_${index}`,
      counts: { records: preview.counts.eligible },
      split: preview.split,
    },
    createdAt: new Date().toISOString(),
    downloadUrl: '',
  };
}

/** Unduhan simulasi: dibuat di browser, tidak menyentuh backend. */
export function downloadSimExport(records: DatasetItem[], config: SimExportConfig): void {
  if (typeof window === 'undefined') return;
  const preview = computeSimPreview(records, config);
  const statuses = (config.status ?? 'verified,approved').split(',');
  const rows = records
    .filter((r) => statuses.includes(r.status))
    .map((r) => ({
      record_id: `ds_${String(Math.abs(r.id)).padStart(6, '0')}`,
      product_name: r.productName,
      text: simText(r),
      label: r.goldLabel,
      label_id: r.goldLabel === 'unsafe' ? 1 : 0,
      allergens: (r.correctedAllergens ?? []).map((a) => ({ name: a.name, presence: a.presence })),
      split: preview.split
        ? preview.split.splits.train.includes(r.id)
          ? 'train'
          : preview.split.splits.validation.includes(r.id)
            ? 'validation'
            : 'test'
        : null,
    }));
  const body = JSON.stringify(
    {
      simulation: true,
      note: 'Berkas contoh dari mode simulasi onboarding. Tidak berisi data produksi.',
      export_id: 'exp_sim_download',
      profile: config.profile,
      format: config.format,
      counts: preview.counts,
      split: preview.split,
      records: rows,
    },
    null,
    2,
  );
  const blob = new Blob([body], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SIMULATION_dataset_${config.profile}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
