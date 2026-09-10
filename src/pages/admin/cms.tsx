import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import CmsEditor from '@/components/admin/CmsEditor';
import { Content, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function AdminCmsPage() {
  const { token } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContents();
  }, [currentPage, token]);

  const fetchContents = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Content>>(
        `${API_ENDPOINTS.CONTENTS.LIST}?page=${currentPage}&limit=10`,
        token
      );
      setContents(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch contents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setError(null);
    try {
      await api.post(API_ENDPOINTS.CONTENTS.LIST, data, token!);
      fetchContents();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat konten');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedContent) return;
    setError(null);
    try {
      await api.put(`${API_ENDPOINTS.CONTENTS.LIST}/${selectedContent.id}`, data, token!);
      fetchContents();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate konten');
    }
  };

  const handleDelete = async (content: Content) => {
    if (!confirm('Hapus konten ini?')) return;
    setError(null);
    try {
      await api.delete(`${API_ENDPOINTS.CONTENTS.LIST}/${content.id}`, token!);
      fetchContents();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus konten');
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Judul',
      render: (item: Content) => (
        <span className="font-medium">{item.title}</span>
      ),
    },
    {
      key: 'type',
      label: 'Tipe',
      render: (item: Content) => (
        <Badge variant="info">{item.type}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Content) => (
        <Badge variant={statusVariant(item.status) as any}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Dibuat',
      render: (item: Content) => formatDate(item.createdAt),
    },
  ];

  return (
    <AdminRoute>
      <Head>
        <title>CMS - Admin Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            CMS
          </h1>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <AdminTable
            data={contents}
            columns={columns}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onAdd={() => {
              setSelectedContent(null);
              setIsFormOpen(true);
            }}
            onEdit={(content) => {
              setSelectedContent(content);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            searchPlaceholder="Cari konten..."
          />

          <CmsEditor
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedContent(null);
            }}
            content={selectedContent}
            onSubmit={selectedContent ? handleUpdate : handleCreate}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminCmsPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
