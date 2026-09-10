import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import AllergenForm from '@/components/admin/AllergenForm';
import { Allergen, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';

export default function AdminAllergensPage() {
  const { token } = useAuth();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllergens();
  }, [currentPage, token]);

  const fetchAllergens = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Allergen>>(
        `${API_ENDPOINTS.ALLERGENS.LIST}?page=${currentPage}&limit=10`,
        token
      );
      setAllergens(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch allergens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setError(null);
    try {
      await api.post(API_ENDPOINTS.ALLERGENS.LIST, data, token!);
      fetchAllergens();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat alergen');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedAllergen) return;
    setError(null);
    try {
      await api.put(API_ENDPOINTS.ALLERGENS.DETAIL(selectedAllergen.id), data, token!);
      fetchAllergens();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate alergen');
    }
  };

  const handleDelete = async (allergen: Allergen) => {
    if (!confirm('Hapus alergen ini?')) return;
    setError(null);
    try {
      await api.delete(API_ENDPOINTS.ALLERGENS.DETAIL(allergen.id), token!);
      fetchAllergens();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus alergen');
    }
  };

  const severityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      render: (item: Allergen) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    { key: 'code', label: 'Kode' },
    {
      key: 'severityLevel',
      label: 'Keparahan',
      render: (item: Allergen) => (
        <Badge variant={severityVariant(item.severityLevel) as any}>
          {item.severityLevel}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: Allergen) => (
        <Badge variant={item.isActive ? 'success' : 'default'}>
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminRoute>
      <Head>
        <title>Alergen - Admin Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Alergen
          </h1>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <AdminTable
            data={allergens}
            columns={columns}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onAdd={() => {
              setSelectedAllergen(null);
              setIsFormOpen(true);
            }}
            onEdit={(allergen) => {
              setSelectedAllergen(allergen);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            searchPlaceholder="Cari alergen..."
          />

          <AllergenForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedAllergen(null);
            }}
            allergen={selectedAllergen}
            onSubmit={selectedAllergen ? handleUpdate : handleCreate}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminAllergensPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
