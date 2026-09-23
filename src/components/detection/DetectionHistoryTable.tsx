'use client';

import { useEffect, useState } from 'react';
import { Detection } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { unwrapListApi } from '@/lib/unwrap';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import DetectionDetail from './DetectionDetail';
import { resolveDetectedAllergens } from '@/lib/detection-allergens';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye } from 'lucide-react';

export default function DetectionHistoryTable() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const ctrl = new AbortController();
    setIsLoading(true);
    setError(null);
    api.get(`${API_ENDPOINTS.DETECTIONS.LIST}?page=${currentPage}&limit=10`, token, ctrl.signal)
      .then((res) => {
        const u = unwrapListApi<Detection>(res, currentPage, 10);
        setDetections(u.items);
        setTotal(u.total);
        setTotalPages(u.totalPages);
        // Clamp: page melebihi total (mis. data berkurang) -> reset halaman.
        if (currentPage > u.totalPages && u.totalPages >= 1) {
          setCurrentPage(u.totalPages);
        }
      })
      .catch((err: any) => { if (err?.name !== 'AbortError') setError(err?.message || t('history.loadFail')); })
      .finally(() => setIsLoading(false));
    return () => ctrl.abort();
  }, [currentPage, token]);

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.date')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.product')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.allergens')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.status')}
              </th>
              <th className="pb-3 text-right text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.action')}
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

  // Gagal memuat (tanpa data lama): tampilkan ERROR, bukan EmptyState.
  if (error && detections.length === 0) {
    return (
      <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>
    );
  }

  if (detections.length === 0) {
    return (
      <EmptyState
        title={t('history.empty')}
        description={t('history.emptyDesc')}
        action={{ label: t('history.start'), onClick: () => (window.location.href = '/detect') }}
      />
    );
  }

  return (
    <>
      {error && <div className="mb-4"><Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert></div>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.date')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.product')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.allergens')}
              </th>
              <th className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.status')}
              </th>
              <th className="pb-3 text-right text-sm font-medium text-surface-500 dark:text-surface-400">
                {t('admin.table.action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {detections.map((detection) => {
              const allergens = resolveDetectedAllergens(detection);
              return (
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
                  {allergens.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {allergens.slice(0, 2).map((a) => (
                        <Badge
                          key={a.key}
                          variant={a.severity === 'critical' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {a.name}
                        </Badge>
                      ))}
                      {allergens.length > 2 && (
                        <Badge size="sm">+{allergens.length - 2}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-surface-400">-</span>
                  )}
                </td>
                <td className="py-3">
                  <Badge variant={detection.result === 'safe' ? 'success' : 'danger'}>
                    {detection.result === 'safe' ? t('admin.safe') : t('admin.unsafe')}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setSelectedDetection(detection)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    <Eye className="h-4 w-4" />
                    {t('common.detail')}
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('admin.table.pageInfo', { total, page: currentPage, pages: totalPages })}
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
