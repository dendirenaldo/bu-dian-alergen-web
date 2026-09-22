import { ReactElement, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import CmsEditor from '@/components/admin/CmsEditor';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Content } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/utils';

export default function AdminCmsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const typeLabel = (type: string) => ({ page: t('admin.type.page'), article: t('admin.type.article'), announcement: t('admin.type.announcement') } as any)[type] ?? type;
  const statusLabel = (s: string) => ({ draft: t('admin.contentStatus.draft'), published: t('admin.contentStatus.published'), archived: t('admin.contentStatus.archived') } as any)[s] ?? s;
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: contents, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    // /contents tidak mendukung query page/limit (DTO backend ketat) -> paginasi client-side.
    useAdminList<Content>(API_ENDPOINTS.CONTENTS.LIST, { token, page: currentPage, limit: 10, onPageClamp: setCurrentPage, serverPagination: false });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.CONTENTS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.created')); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };
  const handleUpdate = async (data: any) => {
    if (!selectedContent) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(`${API_ENDPOINTS.CONTENTS.LIST}/${selectedContent.id}`, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.updated')); setIsFormOpen(false); setSelectedContent(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`${API_ENDPOINTS.CONTENTS.LIST}/${deleteTarget.id}`, token!);
      toast(t('toast.deleted')); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'title', label: t('admin.table.title'), render: (item: Content) => <span className="font-medium">{item.title}</span> },
    { key: 'type', label: t('admin.table.type'), render: (item: Content) => <Badge variant="info">{typeLabel(item.type)}</Badge> },
    { key: 'status', label: t('admin.table.status'), render: (item: Content) => <Badge variant={item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'default'}>{statusLabel(item.status)}</Badge> },
    { key: 'publishedAt', label: t('admin.table.publish'), render: (c: Content) => (c as any).publishedAt ? formatDate((c as any).publishedAt) : '—' },
    { key: 'createdAt', label: t('admin.table.created'), render: (item: Content) => formatDate(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.cms')} description={t('admin.pageDesc.cms')} path="/admin/cms" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.cms') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.cms')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.cms')}</p>
          </div>
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          <AdminTable data={contents} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={effectivePage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedContent(null); setIsFormOpen(true); }}
            onEdit={(c) => { setSelectedContent(c); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle={t('admin.emptyTitle.cms')} emptyDescription={t('admin.emptyDesc.cms')} addLabel={t('admin.addLabel.cms')} />
          <CmsEditor isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedContent(null); }} content={selectedContent} onSubmit={selectedContent ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('delete.title')} description={deleteTarget ? t('delete.content', { name: deleteTarget.title }) : undefined} confirmLabel={t('delete.confirm')} cancelLabel={t('delete.cancel')} isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminCmsPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
