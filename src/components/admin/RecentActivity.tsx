'use client';

import { useEffect, useState } from 'react';
import { Detection, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { ArrowRight } from 'lucide-react';

export default function RecentActivity() {
  const { token } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, [token]);

  const fetchRecent = async () => {
    if (!token) return;
    try {
      const res = await api.get<PaginatedResponse<Detection>>(
        `${API_ENDPOINTS.DASHBOARD.RECENT}?limit=5`,
        token
      );
      setDetections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-surface-500 dark:text-surface-400">
        Belum ada aktivitas terbaru.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {detections.map((detection) => (
        <div
          key={detection.id}
          className="flex items-center justify-between rounded-xl border border-surface-100 p-3 dark:border-surface-800"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
              {detection.product?.name || 'Produk Tidak Dikenal'}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {formatDateTime(detection.createdAt)}
            </p>
          </div>
          <Badge variant={detection.result === 'safe' ? 'success' : 'danger'} size="sm">
            {detection.result === 'safe' ? 'Aman' : 'Berbahaya'}
          </Badge>
        </div>
      ))}
    </div>
  );
}
