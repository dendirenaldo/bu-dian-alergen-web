'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { unwrapData } from '@/lib/unwrap';
import { TrendApiResponse, TrendPoint } from '@/types/trend';

function shortDate(iso: string, locale: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
}

export default function TrendChart({ days = 14 }: { days?: number }) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [data, setData] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const ctrl = new AbortController();
    setIsLoading(true);
    api.get<TrendApiResponse>(`${API_ENDPOINTS.DASHBOARD.TREND}?days=${days}`, token, ctrl.signal)
      .then((res) => setData(unwrapData<{ days: number; trend: TrendPoint[] }>(res).trend ?? []))
      .catch((err: any) => { if (err?.name !== 'AbortError') setError(err?.message || t('api.err.loadFail')); })
      .finally(() => setIsLoading(false));
    return () => ctrl.abort();
  }, [token, days, t]);

  if (isLoading) return <Card padding="md"><Skeleton width="100%" height="16rem" /></Card>;
  if (error) return <Card padding="md"><p className="py-8 text-center text-sm text-red-600">{error}</p></Card>;
  if (!data.length || data.every((p) => p.total === 0)) {
    return (
      <Card padding="md">
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">{t('admin.trendTitle')}</h2>
        <EmptyState title={t('admin.trendEmpty')} description={t('admin.dashboardDesc')} />
      </Card>
    );
  }

  const chartData = data.map((p) => ({ ...p, label: shortDate(p.date, locale) }));

  return (
    <Card padding="md">
      <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">{t('admin.trendTitle')}</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="safe" name={t('admin.safe')} stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="unsafe" name={t('admin.unsafe')} stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
