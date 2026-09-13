import { ReactElement, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import UserForm from '@/components/admin/UserForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { User } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: users, total, totalPages, isLoading, error, setError, refresh } =
    useAdminList<User>(API_ENDPOINTS.USERS.LIST, { token, page: currentPage, limit: 10 });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.USERS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Pengguna berhasil dibuat'); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || 'Gagal membuat pengguna'); throw err; }
    finally { setIsSaving(false); }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedUser) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.USERS.DETAIL(selectedUser.id), data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Perubahan pengguna disimpan'); setIsFormOpen(false); setSelectedUser(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal mengupdate pengguna'); throw err; }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.USERS.DETAIL(deleteTarget.id), token!);
      toast('Pengguna berhasil dihapus'); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal menghapus pengguna'); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'name', label: 'Nama', render: (item: User) => <span className="font-medium">{item.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Peran', render: (item: User) => <Badge variant={item.role === 'admin' ? 'primary' : 'default'}>{item.role === 'admin' ? 'Admin' : 'Pengguna'}</Badge> },
    { key: 'isActive', label: 'Status', render: (item: User) => <Badge variant={item.isActive === false ? 'default' : 'success'}>{item.isActive === false ? 'Nonaktif' : 'Aktif'}</Badge> },
    { key: 'createdAt', label: 'Dibuat', render: (item: User) => formatDate(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <Head><title>Pengguna - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Pengguna' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pengguna</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Kelola akun pengguna dan hak akses admin.</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          <AdminTable data={users} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedUser(null); setIsFormOpen(true); }}
            onEdit={(user) => { setSelectedUser(user); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle="Belum ada pengguna" emptyDescription="Tambahkan pengguna pertama." addLabel="Tambah Pengguna" />
          <UserForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedUser(null); }} user={selectedUser} onSubmit={selectedUser ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus pengguna?" description={deleteTarget ? `Hapus pengguna "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.` : undefined} confirmLabel="Ya, hapus" cancelLabel="Batal" isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminUsersPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
