import { ReactElement, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import AdminTable from '@/components/admin/AdminTable';
import ProductForm from '@/components/admin/ProductForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Product } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/utils';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: products, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<Product>(API_ENDPOINTS.PRODUCTS.LIST, {
      token,
      page: currentPage,
      limit: 10,
      extraParams: search ? `&search=${encodeURIComponent(search)}` : '',
    });

  const handleCreate = async (data: any) => {
    setError(null);
    setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.PRODUCTS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.created'));
      setIsFormOpen(false);
      refresh();
    } catch (err: any) {
      setError(err.message || t('toast.failed'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedProduct) return;
    setError(null);
    setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.PRODUCTS.DETAIL(selectedProduct.id), data, token!, {
        idempotencyKey: newIdempotencyKey(),
      });
      toast(t('toast.updated'));
      setIsFormOpen(false);
      setSelectedProduct(null);
      refresh();
    } catch (err: any) {
      setError(err.message || t('toast.failed'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.PRODUCTS.DETAIL(deleteTarget.id), token!);
      toast(t('toast.deleted'));
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      setError(err.message || t('toast.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.table.name'),
      render: (item: Product) => <span className="font-medium">{item.name}</span>,
    },
    { key: 'brand', label: t('admin.table.brand'), render: (p: Product) => p.brand || '—' },
    { key: 'barcode', label: t('admin.table.barcode'), render: (p: Product) => p.barcode || '—' },
    { key: 'category', label: t('admin.table.category'), render: (p: Product) => p.category?.name || '—' },
    {
      key: 'isActive',
      label: t('admin.table.status'),
      render: (p: Product) => (
        <Badge variant={p.isActive === false ? 'default' : 'success'}>
          {p.isActive === false ? t('admin.status.inactive') : t('admin.status.active')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: t('admin.table.created'),
      render: (item: Product) => formatDate(item.createdAt),
    },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.products')} description={t('admin.pageDesc.products')} path="/admin/products" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.products') }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t('admin.products')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {t('admin.pageDesc.products')}
            </p>
          </div>

          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}

          <AdminTable
            data={products}
            columns={columns}
            isLoading={isLoading}
            total={total}
            totalPages={totalPages}
            currentPage={effectivePage}
            onPageChange={setCurrentPage}
            onSearch={(q) => {
              setCurrentPage(1);
              setSearch(q);
            }}
            onAdd={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            onEdit={(product) => {
              setSelectedProduct(product);
              setIsFormOpen(true);
            }}
            onDelete={setDeleteTarget}
            searchPlaceholder={t('admin.search.products')}
            emptyTitle={t('admin.emptyTitle.products')}
            emptyDescription={t('admin.emptyDesc.products')}
            addLabel={t('admin.addLabel.products')}
          />

          <ProductForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onSubmit={selectedProduct ? handleUpdate : handleCreate}
            isSaving={isSaving}
          />

          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title={t('delete.title')}
            description={deleteTarget ? t('delete.product', { name: deleteTarget.name }) : undefined}
            confirmLabel={t('delete.confirm')}
            cancelLabel={t('delete.cancel')}
            isLoading={isDeleting}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminProductsPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
