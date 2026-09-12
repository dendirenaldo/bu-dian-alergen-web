import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import StatsCard from '@/components/admin/StatsCard';
import RecentActivity from '@/components/admin/RecentActivity';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats, ApiResponse } from '@/types';
import { Package, AlertTriangle, Users, ScanSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await api.get<ApiResponse<DashboardStats>>(API_ENDPOINTS.DASHBOARD.STATS, token);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminRoute>
      <Head>
        <title>Dashboard Admin - Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Dashboard
          </h1>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton width="4rem" height="1.75rem" />
                      <Skeleton width="5rem" height="0.875rem" />
                    </div>
                    <Skeleton variant="rectangular" width="3rem" height="3rem" className="rounded-xl" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                  <StatsCard icon={Package} value={stats?.totalProducts || 0} label="Produk" color="primary" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <StatsCard icon={AlertTriangle} value={stats?.totalAllergens || 0} label="Alergen" color="warning" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <StatsCard icon={Users} value={stats?.totalUsers || 0} label="Pengguna" color="success" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <StatsCard icon={ScanSearch} value={stats?.totalDetections || 0} label="Deteksi" color="danger" />
                </motion.div>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
                Statistik Deteksi
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Aman</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {stats?.safeCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Berbahaya</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {stats?.unsafeCount || 0}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
                Aktivitas Terbaru
              </h2>
              <RecentActivity />
            </Card>
          </div>
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminDashboard.getLayout = (page: ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
