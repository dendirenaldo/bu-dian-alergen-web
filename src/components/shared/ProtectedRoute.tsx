import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Skeleton from '@/components/ui/Skeleton';

const BYPASS_PATHS = ['/verify-email', '/check-email', '/forgot-password', '/reset-password'];

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isUnverified = !!user && user.emailVerified === false;
  const isBypass = BYPASS_PATHS.some((p) => router.pathname === p || router.pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (isLoading || !router.isReady || isBypass) return;
    if (!user) {
      router.replace('/login');
    } else if (isUnverified) {
      const email = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
      router.replace(`/check-email${email}`);
    } else if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, isUnverified, isBypass, router]);

  if (isLoading) {
    return (
      <div className="page-container space-y-4" role="status" aria-busy="true" aria-label="Loading">
        <Skeleton width="40%" height="1.5rem" />
        <Skeleton width="100%" height="6rem" variant="rectangular" />
        <Skeleton width="100%" height="10rem" variant="rectangular" />
      </div>
    );
  }

  if (isBypass) return <>{children}</>;
  if (!user) return null;
  if (isUnverified) return null;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
