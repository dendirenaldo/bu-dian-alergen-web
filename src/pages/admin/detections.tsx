import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import DetectionDetail from '@/components/detection/DetectionDetail';
import { Detection, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { Eye } from 'lucide-react';

export default function AdminDetectionsPage() {
  const { token } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  useEffect(() => {
    fetchDetections();
  }, [currentPage, token]);

  const fetchDetections = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Detection>>(
        `${API_ENDPOINTS.DETECTIONS.LIST}?page=${currentPage}&limit=10`,
        token
      );
      setDetections(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch detections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: Detection) => (
        <span className="font-mono text-sm">#{item.id}</span>
      ),
    },
    {
      key: 'product',
      label: 'Produk',
      render: (item: Detection) => (
        <span className="font-medium">{item.product?.name || '-'}</span>
      ),
    },
    {
      key: 'result',
      label: 'Hasil',
      render: (item: Detection) => (
        <Badge variant={item.result === 'safe' ? 'success' : 'danger'}>
          {item.result === 'safe' ? 'Aman' : 'Berbahaya'}
        </Badge>
      ),
    },
    {
      key: 'confidenceScore',
      label: 'Confidence',
      render: (item: Detection) => (
        <span>{Math.round(item.confidenceScore * 100)}%</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Tanggal',
      render: (item: Detection) => formatDate(item.createdAt),
    },
  ];

  return (
    <AdminRoute>
      <Head>
        <title>Deteksi - Admin Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Deteksi
          </h1>

          <AdminTable
            data={detections}
            columns={columns}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onEdit={(detection) => setSelectedDetection(detection)}
            searchPlaceholder="Cari deteksi..."
          />

          {selectedDetection && (
            <DetectionDetail
              detection={selectedDetection}
              onClose={() => setSelectedDetection(null)}
            />
          )}
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDetectionsPage.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
