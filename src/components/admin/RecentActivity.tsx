'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Detection } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { unwrapData, unwrapListApi } from '@/lib/unwrap';
import { formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

export default function RecentActivity({ limit = 5 }: { limit?: number }) {
  const { token } = useAuth();
  const { t } = useLocale();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const ctrl = new AbortController();
    setIsLoading(true);
    api.get(`${API_ENDPOINTS.DASHBOARD.RECENT}?limit=${limit}`, token, ctrl.signal)
      .then((res) => {
        const u = unwrapListApi<Detection>(res);
        const list = u.items.length ? u.items : (Array.isArray(unwrapData<any>(res)) ? unwrapData<any>(res) : []);
        setDetections(list.slice(0, limit));
      })
      .catch((err: any) => { if (err?.name !== 'AbortError') setError(err?.message || t('admin.recentFail')); })
      .finally(() => setIsLoading(false));
    return () => ctrl.abort();
  }, [token, limit]);

  if (isLoading) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} width="100%" height="3.5rem" />)}</div>;
  if (error) return <p className="py-6 text-center text-sm text-red-600">{error}</p>;
  if (detections.length === 0) return <EmptyState title={t('admin.recentEmpty')} description={t('admin.recentEmptyDesc')} />;

  return (
    <div className="space-y-3">
      {detections.map((detection) => (
        <Link key={detection.id} href="/admin/detections" className="flex items-center justify-between rounded-xl border border-surface-100 p-3 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800/50">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{detection.product?.name || t('admin.detectText')}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{formatDateTime(detection.createdAt)}</p>
          </div>
          <Badge variant={detection.result === 'safe' ? 'success' : 'danger'}>{detection.result === 'safe' ? t('admin.safe') : t('admin.unsafe')}</Badge>
        </Link>
      ))}
    </div>
  );
}
