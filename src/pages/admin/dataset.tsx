import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import DatasetCorrectionModal, { DatasetCorrectionPayload } from '@/components/admin/DatasetCorrectionModal';
import DatasetExportModal from '@/components/admin/DatasetExportModal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MenuSelect from '@/components/ui/MenuSelect';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import AdminTableSkeleton from '@/components/ui/AdminTableSkeleton';
import StatsCard from '@/components/admin/StatsCard';
import { CorrectedAllergenItem, DatasetItem } from '@/types';
import { asArray } from '@/lib/json';
import { useToast } from '@/contexts/ToastContext';
import { useTableControls } from '@/hooks/useTableControls';
import { useDebounce } from '@/hooks/useDebounce';
import { formatConfidence, formatDateTime, formatResult } from '@/lib/format';
import {
  DATASET_STATUSES,
  datasetQualityKey,
  datasetQualityVariant,
  datasetStatusKey,
  datasetStatusVariant,
} from '@/lib/dataset-meta';
import { useDatasetService } from '@/onboarding/useDatasetService';
import { emitTourAction } from '@/onboarding/types';
import type { DatasetStatistics } from '@/types';
import { Database, Download, Plus, ShieldCheck, AlertTriangle, ClipboardCheck } from 'lucide-react';

type StatusFilter = '' | (typeof DATASET_STATUSES)[number];
type LabelFilter = '' | 'safe' | 'unsafe';
type QualityFilter = '' | 'ok' | 'warning' | 'error' | 'unassessed';

function ocrOf(item: DatasetItem): string {
  return String(item.correctedText ?? item.corrected_text ?? item.ocrText ?? item.ocr_text ?? '');
}

function productOf(item: DatasetItem): string {
  return (
    String(item.productName ?? '').trim() ||
    String(item.detection?.product?.name ?? '').trim() ||
    '—'
  );
}

function correctedListOf(item: DatasetItem): CorrectedAllergenItem[] {
  return asArray(item.correctedAllergens ?? item.corrected_allergens ?? []);
}

function avgConfidenceOf(item: DatasetItem): number | null {
  const list = correctedListOf(item);
  if (list.length === 0) return null;
  const nums = list.map((a) => Number(a?.confidence)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export default function AdminDatasetPage() {
  const { toast } = useToast();
  const { t } = useLocale();
  const router = useRouter();
  const service = useDatasetService();
  const { page: currentPage, setPage: setCurrentPage, limit, changeLimit, sort, toggleSort } = useTableControls();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [labelFilter, setLabelFilter] = useState<LabelFilter>('');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('');
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DatasetStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [correctTarget, setCorrectTarget] = useState<DatasetItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatasetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const refreshKey = useRefCache();

  const refresh = useCallback(() => {
    refreshKey.bump();
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    service
      .list({
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        label: labelFilter || undefined,
        quality: qualityFilter || undefined,
        search: debounced.trim() || undefined,
        sortBy: sort?.key,
        sortDir: sort?.dir,
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        if (res.page !== currentPage) setCurrentPage(res.page);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? t('api.err.loadFail'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, currentPage, limit, statusFilter, labelFilter, qualityFilter, debounced, sort?.key, sort?.dir, t, setCurrentPage, refreshKey.version]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    service
      .statistics()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, refreshKey.version]);

  const handleCorrection = async (payload: DatasetCorrectionPayload) => {
    if (!correctTarget) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await service.update(correctTarget.id, {
        ...payload,
        expected_updated_at: correctTarget.updatedAt,
      });
      toast(t('toast.updated'));
      setCorrectTarget(null);
      refresh();
    } catch (err: any) {
      const msg = err?.message ?? t('toast.failed');
      setModalError(msg);
      setError(msg);
      toast(msg, 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await service.remove(deleteTarget.id);
      toast(t('toast.deleted'));
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      const msg = err?.message ?? t('toast.failed');
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'no',
        sortKey: 'id',
        sortable: true,
        label: t('admin.table.no'),
        render: (item: DatasetItem) => {
          const idx = items.indexOf(item);
          return <span className="font-mono text-xs">{(currentPage - 1) * limit + idx + 1}</span>;
        },
      },
      {
        key: 'product',
        label: t('dataset.product'),
        render: (item: DatasetItem) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{productOf(item)}</span>
            <span className="block truncate text-xs text-surface-500 dark:text-surface-400">
              {[item.brand, item.category].filter(Boolean).join(' • ') || '—'}
            </span>
          </div>
        ),
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
        sortable: true,
        label: t('admin.table.goldLabel'),
        render: (item: DatasetItem) => {
          const g = item.goldLabel ?? item.gold_label ?? 'safe';
          return <Badge variant={g === 'safe' ? 'success' : 'danger'}>{formatResult(g)}</Badge>;
        },
      },
      {
        key: 'status',
        sortable: true,
        label: t('admin.table.status'),
        render: (item: DatasetItem) => (
          <Badge variant={datasetStatusVariant(item.status)}>{t(datasetStatusKey(item.status))}</Badge>
        ),
      },
      {
        key: 'quality',
        label: t('dataset.validation'),
        render: (item: DatasetItem) => (
          <div className="flex flex-col gap-1">
            <Badge variant={datasetQualityVariant(item.qualityStatus)}>{t(datasetQualityKey(item.qualityStatus))}</Badge>
            {item.duplicateOf != null && <span className="text-[11px] text-amber-600 dark:text-amber-400">duplikat #{item.duplicateOf}</span>}
          </div>
        ),
      },
      {
        key: 'allergens',
        label: t('dataset.allergens'),
        render: (item: DatasetItem) => {
          const list = correctedListOf(item);
          if (!list.length) return <span className="text-xs text-surface-400">—</span>;
          return (
            <span className="text-xs">
              {list.slice(0, 2).map((a) => a.name).join(', ')}
              {list.length > 2 ? ` +${list.length - 2}` : ''}
            </span>
          );
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
        key: 'createdAt',
        sortable: true,
        label: t('admin.table.date'),
        render: (item: DatasetItem) => <span className="text-xs">{formatDateTime(item.createdAt)}</span>,
      },
      {
        key: 'open',
        label: t('dataset.review'),
        render: (item: DatasetItem) => {
          const isFirst = item.id === items[0]?.id;
          return (
            <Link
              href={`/admin/dataset/${item.id}`}
              data-tour={isFirst ? 'dataset-row-open' : undefined}
              onClick={() => emitTourAction('dataset-open-record', { id: item.id })}
              className="inline-flex items-center rounded-lg bg-surface-100 px-2.5 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              {t('dataset.open')}
            </Link>
          );
        },
      },
    ],
    [currentPage, items, limit, t],
  );

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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="dataset-stats">
            <StatsCard icon={Database} value={stats?.totals.total ?? 0} label={t('dataset.stats.total')} color="primary" />
            <StatsCard icon={ClipboardCheck} value={stats?.totals.awaitingReview ?? 0} label={t('dataset.stats.awaitingReview')} color="warning" />
            <StatsCard icon={ShieldCheck} value={stats?.totals.exportable ?? 0} label={t('dataset.stats.exportable')} color="success" />
            <StatsCard icon={AlertTriangle} value={(stats?.totals.needsCorrection ?? 0) + (stats?.totals.qualityError ?? 0)} label={t('dataset.stats.qualityIssues')} color="danger" />
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full sm:max-w-xs" data-tour="dataset-search">
                <label htmlFor="dataset-search" className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('common.search')}
                </label>
                <input
                  id="dataset-search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                    emitTourAction('dataset-search');
                  }}
                  placeholder={t('dataset.searchPh')}
                  className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900"
                />
              </div>
              <div className="w-full sm:w-44" data-tour="dataset-status-filter">
                <MenuSelect
                  label={t('dataset.filterStatus')}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                    emitTourAction('dataset-status-filter');
                  }}
                  options={[
                    { value: '', label: t('dataset.allStatus') },
                    ...DATASET_STATUSES.map((s) => ({ value: s, label: t(datasetStatusKey(s)) })),
                  ]}
                />
              </div>
              <div className="w-full sm:w-40">
                <MenuSelect
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
              <div className="w-full sm:w-44">
                <MenuSelect
                  label={t('dataset.filterQuality')}
                  value={qualityFilter}
                  onChange={(e) => {
                    setQualityFilter(e.target.value as QualityFilter);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: t('dataset.allQuality') },
                    { value: 'ok', label: t('dataset.quality.ok') },
                    { value: 'warning', label: t('dataset.quality.warning') },
                    { value: 'error', label: t('dataset.quality.error') },
                    { value: 'unassessed', label: t('dataset.quality.unassessed') },
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/dataset/create"
                data-tour="dataset-create-link"
                onClick={() => emitTourAction('dataset-create-open')}
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {t('dataset.create')}
              </Link>
              <Button
                variant="secondary"
                size="sm"
                data-tour="dataset-export-open"
                onClick={() => {
                  setIsExportOpen(true);
                  emitTourAction('dataset-export-open');
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t('dataset.export.title')}
              </Button>
            </div>
          </div>

          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}

          {showSkeleton ? (
            <AdminTableSkeleton columns={8} rows={5} />
          ) : showEmpty ? (
            <EmptyState
              title={t('admin.emptyTitle.dataset')}
              description={t('admin.emptyDesc.dataset')}
              action={{ label: t('dataset.create'), onClick: () => void router.push('/admin/dataset/create') }}
            />
          ) : (
            <AdminTable
              data={items}
              columns={columns}
              isLoading={isLoading}
              total={total}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              sort={sort}
              onSort={toggleSort}
              limit={limit}
              onLimitChange={changeLimit}
              onEdit={(item) => {
                setModalError(null);
                setCorrectTarget(item);
              }}
              onDelete={setDeleteTarget}
              emptyTitle={t('admin.emptyTitle.dataset')}
              emptyDescription={t('admin.emptyDesc.dataset')}
            />
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
          <DatasetExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            initialStatus={statusFilter ? statusFilter : 'verified,approved'}
            initialLabel={labelFilter}
          />
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

/** Helper kecil untuk memicu refetch tanpa mengubah identity service. */
function useRefCache() {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  return { version, bump };
}
