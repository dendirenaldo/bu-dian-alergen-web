'use client';

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from './OnboardingContext';
import { api } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { unwrapData, unwrapListApi } from '@/lib/unwrap';
import type {
  CorrectedAllergenItem,
  DatasetExportPreview,
  DatasetExportRecord,
  DatasetItem,
  DatasetAuditEntry,
  DatasetStatistics,
  DatasetValidationIssue,
} from '@/types';
import {
  computeSimPreview,
  computeSimStatistics,
  createSimExportRecord,
  createSimDatasetRecords,
  downloadSimExport,
  simText,
  type SimExportConfig,
} from './simulation-data';

export interface DatasetListParams {
  page: number;
  limit: number;
  status?: string;
  label?: string;
  quality?: string;
  search?: string;
  exportEligible?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DatasetCreatePayload {
  product_name?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  ocr_text?: string;
  corrected_text?: string;
  ingredient_text?: string;
  normalized_ingredients?: string[];
  gold_label?: 'safe' | 'unsafe';
  corrected_allergens?: CorrectedAllergenItem[];
  status?: 'draft' | 'pending_review' | 'verified';
  notes?: string;
  acquisition_source?: string;
  annotation_source?: string;
  image_type?: string;
  source_app_version?: string;
  export_eligible?: boolean;
  allow_incomplete?: boolean;
}

export interface DatasetUpdatePayload extends Omit<Partial<DatasetCreatePayload>, 'status'> {
  review_note?: string;
  expected_updated_at?: string;
  status?: string;
  export_eligible?: boolean;
}

export type DatasetReviewAction =
  | 'submit'
  | 'verify'
  | 'approve'
  | 'reject'
  | 'request_correction'
  | 'archive'
  | 'restore';

export const REVIEW_TARGET: Record<string, string> = {
  submit: 'pending_review',
  verify: 'verified',
  approve: 'approved',
  reject: 'rejected',
  request_correction: 'needs_correction',
  unverify: 'needs_correction',
  archive: 'archived',
  restore: 'draft',
};

function simValidate(item: DatasetItem): { issues: DatasetValidationIssue[]; quality: DatasetItem['qualityStatus'] } {
  const issues: DatasetValidationIssue[] = [];
  const text = simText(item).trim();
  const positives = (item.correctedAllergens ?? []).filter((a) =>
    ['present', 'may_contain', 'cross_contamination'].includes(a.presence ?? 'present'),
  );
  if (!item.productName?.trim()) {
    issues.push({ code: 'MISSING_PRODUCT_NAME', field: 'product_name', severity: 'warning', message: 'Nama produk belum diisi.' });
  }
  if (!text) {
    issues.push({ code: 'MISSING_TEXT', field: 'corrected_text', severity: 'error', message: 'Teks bahan masih kosong.' });
  }
  if (!item.imageUrl) {
    issues.push({ code: 'MISSING_IMAGE', field: 'image', severity: 'warning', message: 'Belum ada gambar label.' });
  }
  const humanDeclared = !!item.annotatedAt && item.annotationSource === 'human';
  if (!(item.correctedAllergens ?? []).length) {
    issues.push(
      humanDeclared
        ? {
            code: 'NO_ALLERGEN_RECORDED',
            field: 'corrected_allergens',
            severity: 'warning',
            message: 'Tidak ada alergen tercatat. Pastikan label benar-benar sudah diperiksa.',
          }
        : {
            code: 'MISSING_ANNOTATION',
            field: 'corrected_allergens',
            severity: 'warning',
            message: 'Anotasi alergen belum diisi.',
          },
    );
  }
  if (item.goldLabel === 'safe' && positives.length > 0) {
    issues.push({
      code: 'LABEL_CONFLICT',
      field: 'gold_label',
      severity: 'error',
      message: `Label aman bertentangan dengan alergen positif: ${positives.map((a) => a.name).join(', ')}.`,
    });
  }
  return {
    issues,
    quality: issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : 'ok',
  };
}

function matchesFilters(item: DatasetItem, params: DatasetListParams): boolean {
  if (params.status && !params.status.split(',').includes(item.status)) return false;
  if (params.label && item.goldLabel !== params.label) return false;
  if (params.quality && (item.qualityStatus ?? 'unassessed') !== params.quality) return false;
  if (params.exportEligible !== undefined && (item.exportEligible !== false) !== params.exportEligible) return false;
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    const hay = `${item.productName ?? ''} ${item.brand ?? ''} ${simText(item)} ${item.category ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/**
 * Satu pintu layanan dataset: memilih backend nyata atau simulasi.
 *
 * Halaman tidak perlu tahu mode; begitu onboarding aktif, seluruh operasi
 * diarahkan ke store simulasi dan transport produksi tetap diblokir.
 */
export function useDatasetService() {
  const { token } = useAuth();
  const {
    isSimulation,
    simRecords,
    setSimRecords,
    simHistory,
    setSimHistory,
  } = useOnboarding();

  const simList = useCallback(
    (params: DatasetListParams) => {
      let rows = simRecords.filter((r) => matchesFilters(r, params));
      if (params.sortBy) {
        const dir = params.sortDir === 'asc' ? 1 : -1;
        rows = [...rows].sort((a: any, b: any) => {
          const av = a[params.sortBy as string];
          const bv = b[params.sortBy as string];
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * dir;
        });
      }
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / params.limit));
      const page = Math.min(Math.max(1, params.page), totalPages);
      const start = (page - 1) * params.limit;
      return {
        items: rows.slice(start, start + params.limit),
        total,
        page,
        limit: params.limit,
        totalPages,
      };
    },
    [simRecords],
  );

  const list = useCallback(
    async (params: DatasetListParams) => {
      if (isSimulation) return simList(params);
      const p = new URLSearchParams();
      p.set('page', String(params.page));
      p.set('limit', String(params.limit));
      if (params.status) p.set('status', params.status);
      if (params.label) p.set('label', params.label);
      if (params.quality) p.set('quality', params.quality);
      if (params.search) p.set('search', params.search);
      if (params.exportEligible !== undefined) p.set('exportEligible', params.exportEligible ? '1' : '0');
      if (params.sortBy) {
        p.set('sortBy', params.sortBy);
        p.set('sortDir', params.sortDir ?? 'desc');
      }
      const res = await api.get(`${API_ENDPOINTS.DATASET.LIST}?${p.toString()}`, token ?? undefined);
      return unwrapListApi<DatasetItem>(res, params.page, params.limit);
    },
    [isSimulation, simList, token],
  );

  const get = useCallback(
    async (id: number): Promise<DatasetItem> => {
      if (isSimulation) {
        const found = simRecords.find((r) => r.id === id);
        if (!found) throw new Error('Record simulasi tidak ditemukan');
        return found;
      }
      return unwrapData<DatasetItem>(await api.get(API_ENDPOINTS.DATASET.DETAIL(id), token ?? undefined));
    },
    [isSimulation, simRecords, token],
  );

  const history = useCallback(
    async (item: DatasetItem): Promise<DatasetAuditEntry[]> => {
      if (isSimulation) {
        const entries: DatasetAuditEntry[] = [
          {
            id: -1,
            action: 'dataset.create',
            actorId: item.submittedBy ?? null,
            createdAt: item.createdAt,
            meta: { source: item.source },
          },
        ];
        if (item.annotatedAt) {
          entries.push({ id: -2, action: 'dataset.update', actorId: item.annotatorId ?? null, createdAt: item.annotatedAt, meta: {} });
        }
        if (item.reviewedAt) {
          entries.push({ id: -3, action: `dataset.review`, actorId: item.reviewedBy ?? null, createdAt: item.reviewedAt, meta: { status: item.status } });
        }
        if (item.verifiedAt) {
          entries.push({ id: -4, action: 'dataset.verify', actorId: item.verifiedBy ?? null, createdAt: item.verifiedAt, meta: {} });
        }
        return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      }
      const res = await api.get(`${API_ENDPOINTS.DATASET.DETAIL(item.id)}/history`, token ?? undefined);
      return unwrapData<DatasetAuditEntry[]>(res) ?? [];
    },
    [isSimulation, token],
  );

  const statistics = useCallback(async (): Promise<DatasetStatistics> => {
    if (isSimulation) return computeSimStatistics(simRecords);
    return unwrapData<DatasetStatistics>(
      await api.get(API_ENDPOINTS.DATASET.STATISTICS, token ?? undefined),
    );
  }, [isSimulation, simRecords, token]);

  const create = useCallback(
    async (payload: DatasetCreatePayload): Promise<DatasetItem> => {
      if (!isSimulation) {
        return unwrapData<DatasetItem>(
          await api.post(API_ENDPOINTS.DATASET.LIST, payload, token ?? undefined),
        );
      }
      const id = Math.min(0, ...simRecords.map((r) => r.id)) - 1;
      const base: DatasetItem = {
        id,
        isSimulation: true,
        source: 'manual',
        acquisitionSource: payload.acquisition_source ?? 'admin_manual',
        productName: payload.product_name ?? null,
        brand: payload.brand ?? null,
        category: payload.category ?? null,
        barcode: payload.barcode ?? null,
        ocrText: payload.ocr_text ?? null,
        correctedText: payload.corrected_text ?? null,
        ingredientText: payload.ingredient_text ?? null,
        normalizedIngredients: payload.normalized_ingredients ?? null,
        goldLabel: payload.gold_label ?? 'safe',
        correctedAllergens: payload.corrected_allergens ?? [],
        status: (payload.status ?? 'draft') as DatasetItem['status'],
        notes: payload.notes ?? null,
        annotationSource: payload.annotation_source ?? 'human',
        annotationVersion: '1',
        annotatedAt: new Date().toISOString(),
        ocrStatus: payload.ocr_text ? 'processed' : 'pending',
        imageType: payload.image_type ?? null,
        exportEligible: payload.export_eligible ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { issues, quality } = simValidate(base);
      base.validationErrors = issues;
      base.qualityStatus = quality;
      setSimRecords((prev) => [base, ...prev]);
      return base;
    },
    [isSimulation, setSimRecords, simRecords, token],
  );

  const update = useCallback(
    async (id: number, payload: DatasetUpdatePayload): Promise<DatasetItem> => {
      if (!isSimulation) {
        return unwrapData<DatasetItem>(
          await api.patch(API_ENDPOINTS.DATASET.DETAIL(id), payload, token ?? undefined),
        );
      }
      let updated: DatasetItem | null = null;
      setSimRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next: DatasetItem = {
            ...r,
            ...(payload.product_name !== undefined ? { productName: payload.product_name } : {}),
            ...(payload.brand !== undefined ? { brand: payload.brand } : {}),
            ...(payload.category !== undefined ? { category: payload.category } : {}),
            ...(payload.barcode !== undefined ? { barcode: payload.barcode } : {}),
            ...(payload.ocr_text !== undefined ? { ocrText: payload.ocr_text } : {}),
            ...(payload.corrected_text !== undefined ? { correctedText: payload.corrected_text } : {}),
            ...(payload.ingredient_text !== undefined ? { ingredientText: payload.ingredient_text } : {}),
            ...(payload.normalized_ingredients !== undefined
              ? { normalizedIngredients: payload.normalized_ingredients }
              : {}),
            ...(payload.gold_label !== undefined ? { goldLabel: payload.gold_label } : {}),
            ...(payload.corrected_allergens !== undefined
              ? { correctedAllergens: payload.corrected_allergens }
              : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
            ...(payload.export_eligible !== undefined ? { exportEligible: payload.export_eligible } : {}),
            ...(payload.review_note !== undefined ? { reviewNote: payload.review_note } : {}),
            ...(payload.status !== undefined ? { status: payload.status as DatasetItem['status'] } : {}),
            updatedAt: new Date().toISOString(),
          };
          const { issues, quality } = simValidate(next);
          next.validationErrors = issues;
          next.qualityStatus = quality;
          updated = next;
          return next;
        }),
      );
      if (!updated) throw new Error('Record simulasi tidak ditemukan');
      return updated;
    },
    [isSimulation, setSimRecords, token],
  );

  const review = useCallback(
    async (id: number, action: DatasetReviewAction, note?: string, expectedUpdatedAt?: string): Promise<DatasetItem> => {
      if (!isSimulation) {
        return unwrapData<DatasetItem>(
          await api.patch(
            API_ENDPOINTS.DATASET.REVIEW(id),
            { action, note, expected_updated_at: expectedUpdatedAt },
            token ?? undefined,
          ),
        );
      }
      const target = REVIEW_TARGET[action];
      const now = new Date().toISOString();
      void now;
      return update(id, {
        status: target,
        review_note: note,
      } as DatasetUpdatePayload);
    },
    [isSimulation, token, update],
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      if (!isSimulation) {
        await api.delete(API_ENDPOINTS.DATASET.DETAIL(id), token ?? undefined);
        return;
      }
      setSimRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [isSimulation, setSimRecords, token],
  );

  const contribute = useCallback(
    async (
      detectionId: number,
      payload: {
        corrected_text?: string;
        gold_label?: 'safe' | 'unsafe';
        corrected_allergens?: CorrectedAllergenItem[];
        notes?: string;
      },
    ): Promise<DatasetItem> => {
      if (isSimulation) {
        return create({
          product_name: 'Kontribusi simulasi',
          corrected_text: payload.corrected_text,
          gold_label: payload.gold_label,
          corrected_allergens: payload.corrected_allergens,
          notes: payload.notes,
          status: 'draft',
          acquisition_source: 'user_scan',
        });
      }
      return unwrapData<DatasetItem>(
        await api.post(API_ENDPOINTS.DETECTIONS.CONTRIBUTE(detectionId), payload, token ?? undefined),
      );
    },
    [create, isSimulation, token],
  );

  const uploadImage = useCallback(
    async (id: number, file: File, imageType = 'ingredient_label'): Promise<DatasetItem> => {
      if (!isSimulation) {
        const form = new FormData();
        form.append('image', file);
        form.append('image_type', imageType);
        return unwrapData<DatasetItem>(
          await api.post(API_ENDPOINTS.DATASET.IMAGE(id), form, token ?? undefined, { isFormData: true }),
        );
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Gagal membaca berkas simulasi'));
        reader.readAsDataURL(file);
      });
      let updated: DatasetItem | null = null;
      setSimRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next: DatasetItem = {
            ...r,
            imageUrl: dataUrl,
            imageType,
            imageMime: file.type,
            imageSize: file.size,
            originalFilename: file.name,
            imageChecksum: 'simulation',
            updatedAt: new Date().toISOString(),
          };
          const { issues, quality } = simValidate(next);
          next.validationErrors = issues;
          next.qualityStatus = quality;
          updated = next;
          return next;
        }),
      );
      if (!updated) throw new Error('Record simulasi tidak ditemukan');
      return updated;
    },
    [isSimulation, setSimRecords, token],
  );

  const exportPreview = useCallback(
    async (config: SimExportConfig): Promise<DatasetExportPreview> => {
      if (isSimulation) return computeSimPreview(simRecords, config);
      return unwrapData<DatasetExportPreview>(
        await api.post(API_ENDPOINTS.DATASET.EXPORT_PREVIEW, config, token ?? undefined),
      );
    },
    [isSimulation, simRecords, token],
  );

  const exportHistory = useCallback(async (): Promise<DatasetExportRecord[]> => {
    if (isSimulation) return simHistory;
    const res = await api.get(`${API_ENDPOINTS.DATASET.EXPORTS}?page=1&limit=10`, token ?? undefined);
    return unwrapListApi<DatasetExportRecord>(res, 1, 10).items;
  }, [isSimulation, simHistory, token]);

  const createExport = useCallback(
    async (config: SimExportConfig): Promise<DatasetExportRecord> => {
      if (isSimulation) {
        const preview = computeSimPreview(simRecords, config);
        if (preview.counts.eligible === 0) {
          throw new Error('Tidak ada record yang memenuhi syarat ekspor (simulasi).');
        }
        const record = createSimExportRecord(simRecords, config, simHistory.length + 1);
        setSimHistory((prev) => [record, ...prev]);
        return record;
      }
      return unwrapData<DatasetExportRecord>(
        await api.post(API_ENDPOINTS.DATASET.EXPORTS, config, token ?? undefined),
      );
    },
    [isSimulation, setSimHistory, simHistory.length, simRecords, token],
  );

  const downloadExport = useCallback(
    async (record: DatasetExportRecord): Promise<void> => {
      if (isSimulation) {
        downloadSimExport(simRecords, record.config as unknown as SimExportConfig);
        return;
      }
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DATASET.EXPORT_DOWNLOAD(record.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Gagal mengunduh ekspor (HTTP ${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.filename || 'dataset.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },
    [isSimulation, simRecords, token],
  );

  return useMemo(
    () => ({
      isSimulation,
      list,
      get,
      history,
      statistics,
      create,
      update,
      review,
      remove,
      contribute,
      uploadImage,
      exportPreview,
      exportHistory,
      createExport,
      downloadExport,
      resetSimulationRecords: () => setSimRecords(createSimDatasetRecords()),
    }),
    [
      create,
      createExport,
      downloadExport,
      exportHistory,
      exportPreview,
      get,
      history,
      isSimulation,
      list,
      review,
      setSimRecords,
      statistics,
      update,
      remove,
      contribute,
      uploadImage,
    ],
  );
}
