import { ReactElement, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import StatsCard from '@/components/admin/StatsCard';
import RecentActivity from '@/components/admin/RecentActivity';
import TrendChart from '@/components/admin/TrendChart';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats, ApiResponse } from '@/types';
import { Package, AlertTriangle, Users, ScanSearch, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { unwrapData } from '@/lib/unwrap';

export default function AdminDashboard() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const ctrl = new AbortController();
    setIsLoading(true);
    api.get<ApiResponse<DashboardStats>>(API_ENDPOINTS.DASHBOARD.STATS, token, ctrl.signal)
      .then((res) => setStats(unwrapData<DashboardStats>(res)))
      .catch((err: any) => { if (err?.name !== 'AbortError') setError(err?.message || t('api.err.loadFail')); })
      .finally(() => setIsLoading(false));
    return () => ctrl.abort();
  }, [token]);

  const total = (stats?.safeCount || 0) + (stats?.unsafeCount || 0);
  const safePct = total ? Math.round(((stats?.safeCount || 0) / total) * 100) : 0;

  const cards = [
    { href: '/admin/products', icon: Package, value: stats?.totalProducts || 0, label: t('admin.products'), color: 'primary' as const },
    { href: '/admin/allergens', icon: AlertTriangle, value: stats?.totalAllergens || 0, label: t('admin.allergens'), color: 'warning' as const },
    { href: '/admin/users', icon: Users, value: stats?.totalUsers || 0, label: t('admin.users'), color: 'success' as const },
    { href: '/admin/detections', icon: ScanSearch, value: stats?.totalDetections || 0, label: t('admin.detections'), color: 'danger' as const },
  ];

  return (
    <AdminRoute>
      <SeoHead title={t('admin.dashboard')} description={t('seo.adminDesc')} path="/admin" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.dashboard')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.dashboardDesc')}</p>
          </div>

          {error && <Alert variant="error" title={t('api.err.loadFail')} onClose={() => setError(null)}>{error} <button onClick={() => window.location.reload()} className="ml-2 underline">{t('common.retry')}</button></Alert>}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padding="md"><Skeleton width="100%" height="4rem" /></Card>
              ))
            ) : (
              cards.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={c.href} className="block rounded-2xl transition-transform hover:-translate-y-0.5">
                    <StatsCard icon={c.icon} value={c.value} label={c.label} color={c.color} />
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <TrendChart days={14} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{t('admin.statsTitle')}</h2>
                <Link href="/admin/detections" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">{t('common.viewAll')} <ArrowRight className="h-4 w-4" /></Link>
              </div>
              {isLoading ? <Skeleton width="100%" height="5rem" /> : total === 0 ? (
                <EmptyState title={t('admin.noDetection')} description={t('admin.noDetectionDesc')} />
              ) : (
                <div className="space-y-3">
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${safePct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">{t('admin.safe')}: <strong className="text-green-600">{stats?.safeCount || 0}</strong></span>
                    <span className="text-surface-600 dark:text-surface-400">{t('admin.unsafe')}: <strong className="text-red-600">{stats?.unsafeCount || 0}</strong></span>
                    <span className="text-surface-500">{t('admin.safePct', { pct: safePct })}</span>
                  </div>
                </div>
              )}
            </Card>

            <Card padding="md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{t('admin.recentActivity')}</h2>
                <Link href="/admin/detections" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">{t('common.viewAll')} <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <RecentActivity limit={5} />
            </Card>
          </div>
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDashboard.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
