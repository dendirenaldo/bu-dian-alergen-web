import { ReactElement, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import AllergenForm from '@/components/admin/AllergenForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Allergen } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';

const severityVariant = (s: string): 'danger' | 'warning' | 'info' | 'default' => {
  if (s === 'critical') return 'danger';
  if (s === 'high') return 'warning';
  if (s === 'medium') return 'info';
  return 'default';
};
const severityLabel = (s: string, t: (key: string) => string) => ({ low: t('admin.severity.low'), medium: t('admin.severity.medium'), high: t('admin.severity.high'), critical: t('admin.severity.critical') } as any)[s] ?? s;

export default function AdminAllergensPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Allergen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: allergens, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<Allergen>(API_ENDPOINTS.ALLERGENS.LIST, { token, page: currentPage, limit: 10 });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.ALLERGENS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.created')); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };
  const handleUpdate = async (data: any) => {
    if (!selectedAllergen) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.ALLERGENS.DETAIL(selectedAllergen.id), data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.updated')); setIsFormOpen(false); setSelectedAllergen(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.ALLERGENS.DETAIL(deleteTarget.id), token!);
      toast(t('toast.deleted')); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'name', label: t('admin.table.name'), render: (item: Allergen) => <span className="font-medium">{item.name}</span> },
    { key: 'code', label: t('admin.table.code'), render: (a: Allergen) => <span className="font-mono text-xs">{a.code}</span> },
    { key: 'severityLevel', label: t('admin.table.severity'), render: (item: Allergen) => <Badge variant={severityVariant(item.severityLevel)}>{severityLabel(item.severityLevel, t)}</Badge> },
    { key: 'color', label: t('admin.table.color'), render: (a: Allergen) => a.color ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: a.color }} /><span className="font-mono text-xs">{a.color}</span></span> : '—' },
    { key: 'isActive', label: t('admin.table.status'), render: (item: Allergen) => <Badge variant={item.isActive === false ? 'default' : 'success'}>{item.isActive === false ? t('admin.status.inactive') : t('admin.status.active')}</Badge> },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.allergens')} description={t('admin.pageDesc.allergens')} path="/admin/allergens" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.allergens') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.allergens')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.allergens')}</p>
          </div>
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          <AdminTable data={allergens} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={effectivePage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedAllergen(null); setIsFormOpen(true); }}
            onEdit={(a) => { setSelectedAllergen(a); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle={t('admin.emptyTitle.allergens')} emptyDescription={t('admin.emptyDesc.allergens')} addLabel={t('admin.addLabel.allergens')} />
          <AllergenForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedAllergen(null); }} allergen={selectedAllergen} onSubmit={selectedAllergen ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('delete.title')} description={deleteTarget ? t('delete.allergen', { name: deleteTarget.name }) : undefined} confirmLabel={t('delete.confirm')} cancelLabel={t('delete.cancel')} isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminAllergensPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
