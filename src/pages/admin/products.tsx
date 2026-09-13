import { ReactElement, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: products, total, totalPages, isLoading, error, setError, refresh } =
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
      toast('Produk berhasil dibuat');
      setIsFormOpen(false);
      refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat produk');
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
      toast('Perubahan produk disimpan');
      setIsFormOpen(false);
      setSelectedProduct(null);
      refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate produk');
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
      toast('Produk berhasil dihapus');
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus produk');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      render: (item: Product) => <span className="font-medium">{item.name}</span>,
    },
    { key: 'brand', label: 'Merek', render: (p: Product) => p.brand || '—' },
    { key: 'barcode', label: 'Barcode', render: (p: Product) => p.barcode || '—' },
    { key: 'category', label: 'Kategori', render: (p: Product) => p.category?.name || '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (p: Product) => (
        <Badge variant={p.isActive === false ? 'default' : 'success'}>
          {p.isActive === false ? 'Nonaktif' : 'Aktif'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Dibuat',
      render: (item: Product) => formatDate(item.createdAt),
    },
  ];

  return (
    <AdminRoute>
      <Head>
        <title>Produk - Admin Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Produk' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Produk</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Kelola katalog produk. Cari berdasarkan nama, merek, atau barcode.
            </p>
          </div>

          {error && <Alert variant="error" title="Gagal memuat">{error}</Alert>}

          <AdminTable
            data={products}
            columns={columns}
            isLoading={isLoading}
            total={total}
            totalPages={totalPages}
            currentPage={currentPage}
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
            searchPlaceholder="Cari produk, merek, barcode..."
            emptyTitle="Belum ada produk"
            emptyDescription="Tambahkan produk pertama agar katalog tersedia untuk pengguna."
            addLabel="Tambah Produk"
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
            title="Hapus produk?"
            description={deleteTarget ? `Hapus produk "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.` : undefined}
            confirmLabel="Ya, hapus"
            cancelLabel="Batal"
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
