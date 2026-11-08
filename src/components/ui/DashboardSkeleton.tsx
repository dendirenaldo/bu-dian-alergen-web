import Card from './Card';
import Skeleton from './Skeleton';

/** Tiru layout admin dashboard: 4 kartu stat + grafik + 2 panel. */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="18rem" height="1rem" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md">
            <Skeleton width="100%" height="4rem" variant="rectangular" />
          </Card>
        ))}
      </div>
      <Card padding="md">
        <Skeleton width="12rem" height="1.25rem" />
        <div className="mt-4">
          <Skeleton width="100%" height="6rem" variant="rectangular" />
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <Skeleton width="10rem" height="1.25rem" />
          <div className="mt-4 space-y-3">
            <Skeleton width="100%" height="0.625rem" variant="rectangular" className="!rounded-full" />
            <Skeleton width="100%" height="1rem" />
          </div>
        </Card>
        <Card padding="md">
          <Skeleton width="10rem" height="1.25rem" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height="3.5rem" variant="rectangular" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
