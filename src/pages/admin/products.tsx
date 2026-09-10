import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import ProductForm from '@/components/admin/ProductForm';
import { Product, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, token]);

  const fetchProducts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Product>>(
        `${API_ENDPOINTS.PRODUCTS.LIST}?page=${currentPage}&limit=10`,
        token
      );
      setProducts(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setError(null);
    try {
      await api.post(API_ENDPOINTS.PRODUCTS.LIST, data, token!);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat produk');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedProduct) return;
    setError(null);
    try {
      await api.put(API_ENDPOINTS.PRODUCTS.DETAIL(selectedProduct.id), data, token!);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate produk');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Hapus produk ini?')) return;
    setError(null);
    try {
      await api.delete(API_ENDPOINTS.PRODUCTS.DETAIL(product.id), token!);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus produk');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      render: (item: Product) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    { key: 'brand', label: 'Merek' },
    { key: 'barcode', label: 'Barcode' },
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Produk
          </h1>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <AdminTable
            data={products}
            columns={columns}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onAdd={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            onEdit={(product) => {
              setSelectedProduct(product);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            searchPlaceholder="Cari produk..."
          />

          <ProductForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onSubmit={selectedProduct ? handleUpdate : handleCreate}
          />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminProductsPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
