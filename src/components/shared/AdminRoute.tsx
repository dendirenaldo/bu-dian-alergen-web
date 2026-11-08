import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import AdminTableSkeleton from '@/components/ui/AdminTableSkeleton';

const BYPASS_PATHS = ['/verify-email', '/check-email', '/forgot-password', '/reset-password'];

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isUnverified = !!user && user.emailVerified === false;
  const isBypass = BYPASS_PATHS.some((p) => router.pathname === p || router.pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (isLoading || !router.isReady || isBypass) return;
    if (!user || !isAuthenticated) {
      if (isUnverified && user?.email) {
        router.replace(`/check-email?email=${encodeURIComponent(user.email)}`);
      } else {
        router.replace('/login');
      }
    } else if (user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, user, isUnverified, isBypass, router]);

  if (isLoading) {
    return <AdminTableSkeleton columns={5} rows={5} />;
  }

  if (isBypass) return <>{children}</>;
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
