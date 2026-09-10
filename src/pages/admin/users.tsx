import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import UserForm from '@/components/admin/UserForm';
import { User, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, token]);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<User>>(
        `${API_ENDPOINTS.USERS.LIST}?page=${currentPage}&limit=10`,
        token
      );
      setUsers(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setError(null);
    try {
      await api.post(API_ENDPOINTS.USERS.LIST, data, token!);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat user');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedUser) return;
    setError(null);
    try {
      await api.put(API_ENDPOINTS.USERS.DETAIL(selectedUser.id), data, token!);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate user');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm('Hapus user ini?')) return;
    setError(null);
    try {
      await api.delete(API_ENDPOINTS.USERS.DETAIL(user.id), token!);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      render: (item: User) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (item: User) => (
        <Badge variant={item.role === 'admin' ? 'primary' : 'default'}>
          {item.role}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: User) => (
        <Badge variant={item.isActive ? 'success' : 'default'}>
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Dibuat',
      render: (item: User) => formatDate(item.createdAt),
    },
  ];

  return (
    <AdminRoute>
      <Head>
        <title>Users - Admin Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Users
          </h1>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <AdminTable
            data={users}
            columns={columns}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onAdd={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}
            onEdit={(user) => {
              setSelectedUser(user);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            searchPlaceholder="Cari user..."
          />

          <UserForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSubmit={selectedUser ? handleUpdate : handleCreate}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminUsersPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
