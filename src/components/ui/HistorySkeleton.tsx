import Skeleton from './Skeleton';

/** Tiru layout DetectionHistoryTable: tabel 5 kolom + pagination. */
export default function HistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto" role="status" aria-busy="true" aria-label="Loading history">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-800">
            {['Date', 'Product', 'Allergens', 'Status', 'Action'].map((h) => (
              <th
                key={h}
                scope="col"
                className="pb-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400"
              >
                <Skeleton width="5rem" height="1rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="py-3">
                <Skeleton width="6rem" height="1rem" />
              </td>
              <td className="py-3">
                <Skeleton width="8rem" height="1rem" />
              </td>
              <td className="py-3">
                <div className="flex gap-1">
                  <Skeleton width="4rem" height="1.25rem" variant="rectangular" />
                  <Skeleton width="4rem" height="1.25rem" variant="rectangular" />
                </div>
              </td>
              <td className="py-3">
                <Skeleton width="4rem" height="1.25rem" variant="rectangular" />
              </td>
              <td className="py-3 text-right">
                <Skeleton width="3rem" height="1rem" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
