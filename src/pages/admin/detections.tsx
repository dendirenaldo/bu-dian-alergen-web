import { ReactElement, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import DetectionDetail from '@/components/detection/DetectionDetail';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Detection } from '@/types';
import { api, formatApiErrorMessage } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { useTableControls } from '@/hooks/useTableControls';
import { formatConfidence, formatDateTime, formatMethod, formatModelName, formatResult } from '@/lib/format';
import { asObject } from '@/lib/json';

export default function AdminDetectionsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const { page: currentPage, setPage: setCurrentPage, limit, changeLimit, sort, toggleSort } = useTableControls();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const onSearchChange = (v: string) => {
    setSearch(v);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setDebounced(v.trim());
      setCurrentPage(1);
    }, 400);
  };
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Detection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const extra = debounced ? `&search=${encodeURIComponent(debounced)}` : '';
  const { items: detections, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<Detection>(API_ENDPOINTS.DETECTIONS.ADMIN_ALL, { token, page: currentPage, limit, sortBy: sort?.key, sortDir: sort?.dir, extraParams: extra, onPageClamp: setCurrentPage });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.DETECTIONS.DETAIL(deleteTarget.id), token!);
      toast(t('toast.deleted')); setDeleteTarget(null); refresh();
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setError(msg);
      toast(msg, 'error');
    }
    finally { setIsDeleting(false); }
  };

  const ownerLabel = (item: Detection) => {
    if (item.isGuest || !item.userId) return locale === 'id' ? 'Tamu' : 'Guest';
    if (item.user?.name) return `${item.user.name} (${item.user.email || ''})`.trim();
    return `#${item.userId}`;
  };

  const columns = [
    { key: 'id', label: t('admin.table.id'), sortable: true, render: (item: Detection) => <span className="font-mono text-xs">#{item.id}</span> },
    {
      key: 'owner', label: locale === 'id' ? 'Pengguna' : 'User',
      render: (item: Detection) => (
        <span className="text-sm">
          {ownerLabel(item)}
          {item.isGuest && <Badge size="sm" variant="warning" className="ml-1">{locale === 'id' ? 'Tamu' : 'Guest'}</Badge>}
        </span>
      ),
    },
    { key: 'product', label: t('admin.table.product'), render: (item: Detection) => <span className="font-medium">{item.product?.name || (item.ocrText ? `${String(item.ocrText).slice(0, 30)}…` : '—')}</span> },
    { key: 'result', label: t('admin.table.result'), sortable: true, render: (item: Detection) => <Badge variant={item.result === 'safe' ? 'success' : 'danger'}>{formatResult(item.result)}</Badge> },
    { key: 'confidenceScore', label: t('admin.table.confidence'), render: (item: Detection) => <span>{formatConfidence(item.confidenceScore)}</span> },
    {
      key: 'model', label: t('admin.table.model'),
      render: (item: Detection) => {
        const raw = item.modelName || asObject(item.rawModelOutput)?.model_name;
        return <span className="font-mono text-xs">{raw ? formatModelName(raw) : '—'}</span>;
      },
    },
    { key: 'detectionMethod', label: t('admin.table.method'), render: (d: Detection) => <span className="text-xs">{d.detectionMethod ? formatMethod(d.detectionMethod) : '—'}</span> },
    { key: 'createdAt', label: t('admin.table.date'), sortable: true, render: (item: Detection) => formatDateTime(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.detections')} description={t('admin.pageDesc.detections')} path="/admin/detections" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.detections') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.detections')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.detections')}</p>
          </div>
          <div>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('admin.search.default')}
              className="w-full max-w-sm rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900"
            />
          </div>
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          <AdminTable data={detections} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={effectivePage} onPageChange={setCurrentPage} sort={sort} onSort={toggleSort} limit={limit} onLimitChange={changeLimit}
            onView={setSelectedDetection} onDelete={setDeleteTarget}
            emptyTitle={t('admin.emptyTitle.detections')} emptyDescription={t('admin.emptyDesc.detections')} />
          {selectedDetection && <DetectionDetail detection={selectedDetection} onClose={() => setSelectedDetection(null)} />}
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('delete.title')} description={t('delete.detection')} confirmLabel={t('delete.confirm')} cancelLabel={t('delete.cancel')} isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDetectionsPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
