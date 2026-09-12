'use client';

import { useState, useEffect } from 'react';
import { Detection, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import DetectionDetail from './DetectionDetail';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function DetectionHistoryTable() {
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

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Tanggal
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Produk
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Alergen
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Status
              </th>
              <th className="pb-3 text-right text-sm font-medium text-surface-500 dark:text-surface-400">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="py-3"><Skeleton width="6rem" height="1rem" /></td>
                <td className="py-3"><Skeleton width="8rem" height="1rem" /></td>
                <td className="py-3"><Skeleton width="4rem" height="1.25rem" /></td>
                <td className="py-3"><Skeleton width="4rem" height="1.25rem" /></td>
                <td className="py-3 text-right"><Skeleton width="3rem" height="1rem" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-surface-500 dark:text-surface-400">
          Belum ada riwayat deteksi.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Tanggal
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Produk
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Alergen
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                Status
              </th>
              <th className="pb-3 text-right text-sm font-medium text-surface-500 dark:text-surface-400">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {detections.map((detection) => (
              <tr
                key={detection.id}
                className="hover:bg-surface-50 dark:hover:bg-surface-800/50"
              >
                <td className="py-3 text-sm text-surface-600 dark:text-surface-400">
                  {formatDate(detection.createdAt)}
                </td>
                <td className="py-3 text-sm font-medium text-surface-900 dark:text-surface-100">
                  {detection.product?.name || '-'}
                </td>
                <td className="py-3">
                  {detection.detectionAllergens && detection.detectionAllergens.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {detection.detectionAllergens.slice(0, 2).map((a) => (
                        <Badge
                          key={a.allergenId}
                          variant={a.severityLevel === 'critical' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {a.name}
                        </Badge>
                      ))}
                      {detection.detectionAllergens.length > 2 && (
                        <Badge size="sm">+{detection.detectionAllergens.length - 2}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-surface-400">-</span>
                  )}
                </td>
                <td className="py-3">
                  <Badge variant={detection.result === 'safe' ? 'success' : 'danger'}>
                    {detection.result === 'safe' ? 'Aman' : 'Berbahaya'}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setSelectedDetection(detection)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    <Eye className="h-4 w-4" />
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedDetection && (
        <DetectionDetail
          detection={selectedDetection}
          onClose={() => setSelectedDetection(null)}
        />
      )}
    </>
  );
}
