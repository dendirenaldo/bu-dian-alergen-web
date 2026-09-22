import { ReactElement, useState } from 'react';
import Link from 'next/link';
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
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/utils';

export default function AdminDetectionsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Detection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { items: detections, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<Detection>(API_ENDPOINTS.DETECTIONS.LIST, { token, page: currentPage, limit: 10, onPageClamp: setCurrentPage });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.DETECTIONS.DETAIL(deleteTarget.id), token!);
      toast(t('toast.deleted')); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'id', label: t('admin.table.id'), render: (item: Detection) => <span className="font-mono text-xs">#{item.id}</span> },
    { key: 'product', label: t('admin.table.product'), render: (item: Detection) => <span className="font-medium">{item.product?.name || (item.ocrText ? `${String(item.ocrText).slice(0, 30)}…` : '—')}</span> },
    { key: 'result', label: t('admin.table.result'), render: (item: Detection) => <Badge variant={item.result === 'safe' ? 'success' : 'danger'}>{item.result === 'safe' ? t('admin.safe') : t('admin.unsafe')}</Badge> },
    { key: 'confidenceScore', label: t('admin.table.confidence'), render: (item: Detection) => <span>{Math.round((item.confidenceScore || 0) * 100)}%</span> },
    { key: 'detectionMethod', label: t('admin.table.method'), render: (d: Detection) => <span className="text-xs">{d.detectionMethod === 'image_ocr' ? t('admin.method.image') : t('admin.method.text')}</span> },
    { key: 'createdAt', label: t('admin.table.date'), render: (item: Detection) => formatDate(item.createdAt) },
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
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          <AdminTable data={detections} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={effectivePage} onPageChange={setCurrentPage}
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
