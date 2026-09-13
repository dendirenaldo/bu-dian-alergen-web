import { ReactElement, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import DetectionDetail from '@/components/detection/DetectionDetail';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Detection } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/utils';

export default function AdminDetectionsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Detection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { items: detections, total, totalPages, isLoading, error, setError, refresh } =
    useAdminList<Detection>(API_ENDPOINTS.DETECTIONS.LIST, { token, page: currentPage, limit: 10 });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.DETECTIONS.DETAIL(deleteTarget.id), token!);
      toast('Hasil deteksi dihapus'); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal menghapus deteksi'); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (item: Detection) => <span className="font-mono text-xs">#{item.id}</span> },
    { key: 'product', label: 'Produk', render: (item: Detection) => <span className="font-medium">{item.product?.name || (item.ocrText ? `${String(item.ocrText).slice(0, 30)}…` : '—')}</span> },
    { key: 'result', label: 'Hasil', render: (item: Detection) => <Badge variant={item.result === 'safe' ? 'success' : 'danger'}>{item.result === 'safe' ? 'Aman' : 'Berbahaya'}</Badge> },
    { key: 'confidenceScore', label: 'Keyakinan', render: (item: Detection) => <span>{Math.round((item.confidenceScore || 0) * 100)}%</span> },
    { key: 'detectionMethod', label: 'Metode', render: (d: Detection) => <span className="text-xs">{d.detectionMethod === 'image_ocr' ? 'Gambar (OCR)' : 'Teks'}</span> },
    { key: 'createdAt', label: 'Tanggal', render: (item: Detection) => formatDate(item.createdAt) },
  ];

  return (
    <AdminRoute>
      <Head><title>Deteksi - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Deteksi' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Deteksi</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Klik ikon mata untuk melihat detail. Hapus bila data uji.</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          <AdminTable data={detections} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            onView={setSelectedDetection} onDelete={setDeleteTarget}
            emptyTitle="Belum ada deteksi" emptyDescription="Hasil deteksi pengguna akan muncul di sini." />
          {selectedDetection && <DetectionDetail detection={selectedDetection} onClose={() => setSelectedDetection(null)} />}
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus deteksi?" description="Hapus hasil deteksi ini? Tindakan ini tidak dapat dibatalkan." confirmLabel="Ya, hapus" cancelLabel="Batal" isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDetectionsPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
