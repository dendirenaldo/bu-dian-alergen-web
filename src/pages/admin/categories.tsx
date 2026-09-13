import { ReactElement, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import CategoryForm from '@/components/admin/CategoryForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Category } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { unwrapData, unwrapListApi } from '@/lib/unwrap';
import { useEffect } from 'react';

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchList = async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await api.get(API_ENDPOINTS.CATEGORIES.LIST, token);
      const u = unwrapListApi<Category>(res);
      setItems(u.items.length ? u.items : (Array.isArray(unwrapData<any>(res)) ? unwrapData<any>(res) : []));
    } catch (err: any) { setError(err.message || 'Gagal memuat kategori'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchList(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async (data: any) => {
    setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.CATEGORIES.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Kategori berhasil dibuat'); setIsFormOpen(false); fetchList();
    } catch (err: any) { setError(err.message || 'Gagal membuat kategori'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleUpdate = async (data: any) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.CATEGORIES.DETAIL(selected.id), data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Perubahan kategori disimpan'); setIsFormOpen(false); setSelected(null); fetchList();
    } catch (err: any) { setError(err.message || 'Gagal mengupdate kategori'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.CATEGORIES.DETAIL(deleteTarget.id), token!);
      toast('Kategori berhasil dihapus'); setDeleteTarget(null); fetchList();
    } catch (err: any) { setError(err.message || 'Gagal menghapus kategori'); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'name', label: 'Nama', render: (c: Category) => <span className="font-medium">{c.name}</span> },
    { key: 'slug', label: 'Slug', render: (c: Category) => <span className="font-mono text-xs">{c.slug}</span> },
    { key: 'sortOrder', label: 'Urutan', render: (c: Category) => String(c.sortOrder ?? 0) },
    { key: 'isActive', label: 'Status', render: (c: Category) => <Badge variant={c.isActive === false ? 'default' : 'success'}>{c.isActive === false ? 'Nonaktif' : 'Aktif'}</Badge> },
  ];

  return (
    <AdminRoute>
      <Head><title>Kategori - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Kategori' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Kategori</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Kelompokkan produk agar mudah dicari.</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          <AdminTable data={items} columns={columns} isLoading={isLoading} total={items.length} totalPages={1} currentPage={1}
            onAdd={() => { setSelected(null); setIsFormOpen(true); }}
            onEdit={(c) => { setSelected(c); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle="Belum ada kategori" emptyDescription="Tambahkan kategori pertama." addLabel="Tambah Kategori" />
          <CategoryForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} category={selected} onSubmit={selected ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus kategori?" description={deleteTarget ? `Hapus kategori "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.` : undefined} confirmLabel="Ya, hapus" cancelLabel="Batal" isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminCategoriesPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
