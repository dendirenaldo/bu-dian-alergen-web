import { ReactElement, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
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

const typeLabel = (t: string) => ({ page: 'Halaman', article: 'Artikel', announcement: 'Pengumuman' } as any)[t] ?? t;
const statusLabel = (s: string) => ({ draft: 'Draf', published: 'Terbit', archived: 'Arsip' } as any)[s] ?? s;

export default function AdminCmsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: contents, total, totalPages, isLoading, error, setError, refresh } =
    useAdminList<Content>(API_ENDPOINTS.CONTENTS.LIST, { token, page: currentPage, limit: 10 });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.CONTENTS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Konten berhasil dibuat'); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || 'Gagal membuat konten'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleUpdate = async (data: any) => {
    if (!selectedContent) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(`${API_ENDPOINTS.CONTENTS.LIST}/${selectedContent.id}`, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Perubahan konten disimpan'); setIsFormOpen(false); setSelectedContent(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal mengupdate konten'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`${API_ENDPOINTS.CONTENTS.LIST}/${deleteTarget.id}`, token!);
      toast('Konten berhasil dihapus'); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal menghapus konten'); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'title', label: 'Judul', render: (item: Content) => <span className="font-medium">{item.title}</span> },
    { key: 'type', label: 'Tipe', render: (item: Content) => <Badge variant="info">{typeLabel(item.type)}</Badge> },
    { key: 'status', label: 'Status', render: (item: Content) => <Badge variant={item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'default'}>{statusLabel(item.status)}</Badge> },
    { key: 'publishedAt', label: 'Terbit', render: (c: Content) => (c as any).publishedAt ? formatDate((c as any).publishedAt) : '—' },
    { key: 'createdAt', label: 'Dibuat', render: (item: Content) => formatDate(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <Head><title>Konten - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Konten' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Konten</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Kelola halaman, artikel, dan pengumuman.</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          <AdminTable data={contents} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedContent(null); setIsFormOpen(true); }}
            onEdit={(c) => { setSelectedContent(c); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle="Belum ada konten" emptyDescription="Buat konten pertama." addLabel="Tambah Konten" />
          <CmsEditor isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedContent(null); }} content={selectedContent} onSubmit={selectedContent ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus konten?" description={deleteTarget ? `Hapus konten "${deleteTarget.title}"? Tindakan ini tidak dapat dibatalkan.` : undefined} confirmLabel="Ya, hapus" cancelLabel="Batal" isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminCmsPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
