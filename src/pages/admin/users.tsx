import { ReactElement, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
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
  const { t } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: users, total, totalPages, effectivePage, isLoading, error, setError, refresh } =
    useAdminList<User>(API_ENDPOINTS.USERS.LIST, { token, page: currentPage, limit: 10 });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.USERS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.created')); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedUser) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.USERS.DETAIL(selectedUser.id), data, token!, { idempotencyKey: newIdempotencyKey() });
      toast(t('toast.updated')); setIsFormOpen(false); setSelectedUser(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); throw err; }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.USERS.DETAIL(deleteTarget.id), token!);
      toast(t('toast.deleted')); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || t('toast.failed')); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'name', label: t('admin.table.name'), render: (item: User) => <span className="font-medium">{item.name}</span> },
    { key: 'email', label: t('admin.table.email') },
    { key: 'role', label: t('admin.table.role'), render: (item: User) => <Badge variant={item.role === 'admin' ? 'primary' : 'default'}>{item.role === 'admin' ? t('admin.form.roleAdmin') : t('admin.form.roleUser')}</Badge> },
    { key: 'isActive', label: t('admin.table.status'), render: (item: User) => <Badge variant={item.isActive === false ? 'default' : 'success'}>{item.isActive === false ? t('admin.status.inactive') : t('admin.status.active')}</Badge> },
    { key: 'createdAt', label: t('admin.table.created'), render: (item: User) => formatDate(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.users')} description={t('admin.pageDesc.users')} path="/admin/users" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.users') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.users')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.users')}</p>
          </div>
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          <AdminTable data={users} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={effectivePage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedUser(null); setIsFormOpen(true); }}
            onEdit={(user) => { setSelectedUser(user); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle={t('admin.emptyTitle.users')} emptyDescription={t('admin.emptyDesc.users')} addLabel={t('admin.addLabel.users')} />
          <UserForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedUser(null); }} user={selectedUser} onSubmit={selectedUser ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('delete.title')} description={deleteTarget ? t('delete.user', { name: deleteTarget.name }) : undefined} confirmLabel={t('delete.confirm')} cancelLabel={t('delete.cancel')} isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminUsersPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
