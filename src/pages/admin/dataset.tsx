import { ReactElement, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import DatasetCorrectionModal, { DatasetCorrectionPayload } from '@/components/admin/DatasetCorrectionModal';
import DatasetDownloadModal from '@/components/admin/DatasetDownloadModal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import AdminTableSkeleton from '@/components/ui/AdminTableSkeleton';
import { DatasetItem } from '@/types';
import { api, formatApiErrorMessage } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatConfidence, formatDateTime, formatMethod, formatModelName, formatResult } from '@/lib/format';

type StatusFilter = '' | 'draft' | 'verified';
type LabelFilter = '' | 'safe' | 'unsafe';

function ocrOf(item: DatasetItem): string {
  return String(item.correctedText ?? item.corrected_text ?? item.ocrText ?? item.ocr_text ?? '');
}

function productOf(item: DatasetItem): string {
  return String(item.detection?.product?.name ?? '').trim() || '—';
}

function avgConfidenceOf(item: DatasetItem): number | null {
  const list = item.correctedAllergens ?? item.corrected_allergens ?? [];
  if (!Array.isArray(list) || list.length === 0) return null;
  const nums = list.map((a) => Number(a?.confidence)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function methodOf(item: DatasetItem): string {
  const det: any = item.detection ?? null;
  return String(det?.detectionMethod ?? det?.detection_method ?? det?.modelName ?? '').trim() || '—';
}

export default function AdminDatasetPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [labelFilter, setLabelFilter] = useState<LabelFilter>('');
  const [correctTarget, setCorrectTarget] = useState<DatasetItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatasetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const exportAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      exportAbortRef.current?.abort();
    },
    [],
  );

  const onSearchChange = (v: string) => {
    setSearch(v);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setDebounced(v.trim());
      setCurrentPage(1);
    }, 400);
  };

  const params: string[] = [];
  if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
  if (labelFilter) params.push(`label=${encodeURIComponent(labelFilter)}`);
  if (debounced) params.push(`search=${encodeURIComponent(debounced)}`);
  const extra = params.length > 0 ? `&${params.join('&')}` : '';

  const { items, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<DatasetItem>(API_ENDPOINTS.DATASET.LIST, {
      token,
      page: currentPage,
      limit: 10,
      extraParams: extra,
      onPageClamp: setCurrentPage,
    });

  const handleCorrection = async (payload: DatasetCorrectionPayload) => {
    if (!correctTarget || !token) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await api.patch(API_ENDPOINTS.DATASET.DETAIL(correctTarget.id), payload, token);
      toast(t('toast.updated'));
      setCorrectTarget(null);
      refresh();
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setModalError(msg);
      setError(msg);
      toast(msg, 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async (item: DatasetItem) => {
    if (!token) return;
    setBusyId(item.id);
    try {
      await api.patch(API_ENDPOINTS.DATASET.VERIFY(item.id), {}, token);
      toast(t('dataset.verifiedToast'));
      refresh();
    } catch (err) {
      toast(formatApiErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnverify = async (item: DatasetItem) => {
    if (!token) return;
    setBusyId(item.id);
    try {
      await api.patch(API_ENDPOINTS.DATASET.UNVERIFY(item.id), {}, token);
      toast(t('dataset.unverifiedToast'));
      refresh();
    } catch (err) {
      toast(formatApiErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.DATASET.DETAIL(deleteTarget.id), token);
      toast(t('toast.deleted'));
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!token || isExporting) return;
    setIsExporting(true);
    exportAbortRef.current?.abort();
    const ctrl = new AbortController();
    exportAbortRef.current = ctrl;
    try {
      const p = new URLSearchParams({ format: 'csv' });
      if (statusFilter) p.set('status', statusFilter);
      if (labelFilter) p.set('label', labelFilter);
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DATASET.EXPORT}?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: 'Request failed' }));
        throw {
          status: res.status,
          statusCode: res.status,
          message: String(payload?.message ?? 'Request failed'),
          fieldErrors: {},
        };
      }
      const blob = await res.blob();
      const d = new Date();
      const pad = (v: number) => String(v).padStart(2, '0');
      const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset_export_${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(t('dataset.exported'));
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      toast(formatApiErrorMessage(err), 'error');
    } finally {
      if (exportAbortRef.current === ctrl) exportAbortRef.current = null;
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: 'no',
      label: t('admin.table.no'),
      render: (item: DatasetItem) => {
        const idx = items.indexOf(item);
        return <span className="font-mono text-xs">{(effectivePage - 1) * 10 + idx + 1}</span>;
      },
    },
    {
      key: 'product',
      label: t('dataset.product'),
      render: (item: DatasetItem) => <span className="font-medium">{productOf(item)}</span>,
    },
    {
      key: 'ocr',
      label: t('admin.table.ocr'),
      render: (item: DatasetItem) => {
        const s = ocrOf(item);
        return <span className="block max-w-xs truncate text-sm">{s ? `${s.slice(0, 80)}${s.length > 80 ? '…' : ''}` : '—'}</span>;
      },
    },
    {
      key: 'goldLabel',
      label: t('admin.table.goldLabel'),
      render: (item: DatasetItem) => {
        const g = item.goldLabel ?? item.gold_label ?? 'safe';
        return <Badge variant={g === 'safe' ? 'success' : 'danger'}>{formatResult(g)}</Badge>;
      },
    },
    {
      key: 'status',
      label: t('admin.table.status'),
      render: (item: DatasetItem) => (
        <Badge variant={item.status === 'verified' ? 'success' : 'warning'}>
          {item.status === 'verified' ? t('dataset.statusVerified') : t('dataset.statusDraft')}
        </Badge>
      ),
    },
    {
      key: 'model',
      label: t('admin.table.model'),
      render: (item: DatasetItem) => {
        const raw = item.detection?.modelName ?? (item.detection?.rawModelOutput as { model_name?: string } | undefined)?.model_name;
        return <span className="font-mono text-xs">{raw ? formatModelName(raw) : '—'}</span>;
      },
    },
    {
      key: 'confidence',
      label: t('admin.table.confidence'),
      render: (item: DatasetItem) => {
        const avg = avgConfidenceOf(item);
        return <span className="font-mono text-xs">{avg == null ? '—' : formatConfidence(avg)}</span>;
      },
    },
    {
      key: 'method',
      label: t('admin.table.method'),
      render: (item: DatasetItem) => {
        const raw: any = (item.detection as any)?.detectionMethod ?? (item.detection as any)?.detection_method ?? null;
        return <span className="text-xs">{raw ? formatMethod(raw) : methodOf(item) === '—' ? '—' : methodOf(item)}</span>;
      },
    },
    {
      key: 'createdAt',
      label: t('admin.table.date'),
      render: (item: DatasetItem) => formatDateTime(item.createdAt),
    },
    {
      key: 'verification',
      label: t('dataset.status'),
      render: (item: DatasetItem) =>
        item.status === 'verified' ? (
          <Button size="sm" variant="secondary" disabled={busyId === item.id} onClick={() => void handleUnverify(item)}>
            {t('dataset.unverify')}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled={busyId === item.id} onClick={() => void handleVerify(item)}>
            {t('dataset.verify')}
          </Button>
        ),
    },
  ];

  const showSkeleton = isLoading && items.length === 0;
  const showEmpty = !isLoading && items.length === 0;

  return (
    <AdminRoute>
      <SeoHead title={t('admin.dataset')} description={t('admin.pageDesc.dataset')} path="/admin/dataset" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.dataset') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.dataset')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.dataset')}</p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('dataset.searchPh')}
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  label={t('dataset.filterStatus')}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: t('dataset.allStatus') },
                    { value: 'draft', label: t('dataset.statusDraft') },
                    { value: 'verified', label: t('dataset.statusVerified') },
                  ]}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  label={t('dataset.filterLabel')}
                  value={labelFilter}
                  onChange={(e) => {
                    setLabelFilter(e.target.value as LabelFilter);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: t('dataset.allLabels') },
                    { value: 'safe', label: t('result.safe') },
                    { value: 'unsafe', label: t('result.unsafe') },
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void handleExportCsv()} isLoading={isExporting}>
                {t('dataset.exportCsv')}
              </Button>
              <Button size="sm" onClick={() => setIsDownloadOpen(true)}>
                {t('dataset.download')}
              </Button>
            </div>
          </div>

          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}

          {showSkeleton ? (
            <AdminTableSkeleton columns={7} rows={5} />
          ) : showEmpty ? (
            <EmptyState title={t('admin.emptyTitle.dataset')} description={t('admin.emptyDesc.dataset')} />
          ) : (
            <>
              <AdminTable
                data={items}
                columns={columns}
                isLoading={isLoading}
                total={total}
                totalPages={1}
                onEdit={(item) => {
                  setModalError(null);
                  setCorrectTarget(item);
                }}
                onDelete={setDeleteTarget}
                emptyTitle={t('admin.emptyTitle.dataset')}
                emptyDescription={t('admin.emptyDesc.dataset')}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t('admin.table.pageInfo', { total, page: effectivePage, pages: totalPages })}
                </p>
                <Pagination currentPage={effectivePage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </>
          )}

          <DatasetCorrectionModal
            isOpen={!!correctTarget}
            onClose={() => {
              setCorrectTarget(null);
              setModalError(null);
            }}
            item={correctTarget}
            onSubmit={handleCorrection}
            isSaving={isSaving}
            serverError={modalError}
          />
          <DatasetDownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title={t('delete.title')}
            description={t('delete.dataset')}
            confirmLabel={t('delete.confirm')}
            cancelLabel={t('delete.cancel')}
            isLoading={isDeleting}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDatasetPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
