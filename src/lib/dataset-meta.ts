import type { DatasetQualityStatus, DatasetStatus } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

/** Urutan tampilan status pada filter & badge. */
export const DATASET_STATUSES: DatasetStatus[] = [
  'draft',
  'pending_review',
  'needs_correction',
  'verified',
  'approved',
  'rejected',
  'archived',
];

export const DATASET_STATUS_KEYS: Record<DatasetStatus, string> = {
  draft: 'dataset.status.draft',
  pending_review: 'dataset.status.pending_review',
  needs_correction: 'dataset.status.needs_correction',
  verified: 'dataset.status.verified',
  approved: 'dataset.status.approved',
  rejected: 'dataset.status.rejected',
  archived: 'dataset.status.archived',
};

export function datasetStatusKey(status: string | null | undefined): string {
  return DATASET_STATUS_KEYS[(status ?? 'draft') as DatasetStatus] ?? 'dataset.status.draft';
}

/** Varian Badge untuk tiap status (bukan warna acak: mengikuti makna). */
export function datasetStatusVariant(
  status: string | null | undefined,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'success';
    case 'pending_review':
      return 'info';
    case 'needs_correction':
    case 'draft':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'default';
  }
}

export const DATASET_QUALITY_KEYS: Record<DatasetQualityStatus, string> = {
  unassessed: 'dataset.quality.unassessed',
  ok: 'dataset.quality.ok',
  warning: 'dataset.quality.warning',
  error: 'dataset.quality.error',
};

export function datasetQualityKey(q: string | null | undefined): string {
  return DATASET_QUALITY_KEYS[(q ?? 'unassessed') as DatasetQualityStatus] ?? 'dataset.quality.unassessed';
}

export function datasetQualityVariant(
  q: string | null | undefined,
): 'default' | 'success' | 'warning' | 'danger' {
  if (q === 'ok') return 'success';
  if (q === 'warning') return 'warning';
  if (q === 'error') return 'danger';
  return 'default';
}

export const DATASET_SOURCE_KEYS: Record<string, string> = {
  detection: 'dataset.source.detection',
  manual: 'dataset.source.manual',
  import: 'dataset.source.import',
  user_submission: 'dataset.source.user_submission',
};

export const ACQUISITION_SOURCE_KEYS: Record<string, string> = {
  user_scan: 'dataset.acq.user_scan',
  admin_manual: 'dataset.acq.admin_manual',
  admin_import: 'dataset.acq.admin_import',
  detection_promotion: 'dataset.acq.detection_promotion',
  ocr_correction: 'dataset.acq.ocr_correction',
};

export const ALLERGEN_PRESENCE_KEYS: Record<string, string> = {
  present: 'dataset.presence.present',
  absent: 'dataset.presence.absent',
  unknown: 'dataset.presence.unknown',
  may_contain: 'dataset.presence.may_contain',
  cross_contamination: 'dataset.presence.cross_contamination',
  not_stated: 'dataset.presence.not_stated',
  not_evaluated: 'dataset.presence.not_evaluated',
};

export const ALLERGEN_PRESENCES = Object.keys(ALLERGEN_PRESENCE_KEYS);

export const EXPORT_PROFILE_KEYS: Record<string, string> = {
  raw: 'dataset.profile.raw',
  nlp: 'dataset.profile.nlp',
  image_classification: 'dataset.profile.image',
  multimodal: 'dataset.profile.multimodal',
};

export const EXPORT_PROFILE_DESC_KEYS: Record<string, string> = {
  raw: 'dataset.profile.rawDesc',
  nlp: 'dataset.profile.nlpDesc',
  image_classification: 'dataset.profile.imageDesc',
  multimodal: 'dataset.profile.multimodalDesc',
};

/** Aksi review yang masuk akal untuk status saat ini (UI; backend tetap otoritatif). */
export const REVIEW_ACTIONS: Record<DatasetStatus, Array<'submit' | 'verify' | 'approve' | 'reject' | 'request_correction' | 'archive' | 'restore'>> = {
  draft: ['submit', 'verify', 'archive'],
  pending_review: ['approve', 'verify', 'request_correction', 'reject', 'archive'],
  needs_correction: ['submit', 'reject', 'archive'],
  verified: ['approve', 'request_correction', 'archive'],
  approved: ['request_correction', 'archive'],
  rejected: ['restore', 'request_correction', 'archive'],
  archived: ['restore'],
};

export const REVIEW_ACTION_KEYS: Record<string, string> = {
  submit: 'dataset.review.submit',
  verify: 'dataset.review.verify',
  approve: 'dataset.review.approve',
  reject: 'dataset.review.reject',
  request_correction: 'dataset.review.requestCorrection',
  archive: 'dataset.review.archive',
  restore: 'dataset.review.restore',
};

/**
 * URL media dataset. Path `/uploads/...` dilayani backend, bukan origin web.
 * URL absolut/data: dibiarkan; null/undefined dikembalikan null.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  const value = String(url ?? '').trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${API_BASE_URL}${value}`;
  return value;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v.toFixed(v >= 100 || u === 0 ? 0 : 1)} ${units[u]}`;
}
