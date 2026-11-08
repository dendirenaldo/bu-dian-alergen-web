import Skeleton from './Skeleton';

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  showSearch?: boolean;
}

/** Tiru layout AdminTable: toolbar + tabel + pagination. */
export default function AdminTableSkeleton({
  columns = 5,
  rows = 5,
  showSearch = true,
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading table">
      {showSearch && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton width="16rem" height="2.25rem" variant="rectangular" />
          <Skeleton width="7rem" height="2rem" variant="rectangular" />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} scope="col" className="px-4 py-3">
                  <Skeleton width="5rem" height="1rem" />
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <Skeleton width={c === 0 ? '8rem' : '6rem'} height="1rem" />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <Skeleton width="4rem" height="1rem" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton width="12rem" height="1rem" />
        <Skeleton width="10rem" height="2rem" variant="rectangular" />
      </div>
    </div>
  );
}
