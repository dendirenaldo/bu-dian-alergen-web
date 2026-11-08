import Card from './Card';
import Skeleton from './Skeleton';

/** Tiru layout DetectionResult: header + status box + tags + OCR. */
export default function DetailSkeleton() {
  return (
    <Card padding="md" className="space-y-4" role="status" aria-busy="true" aria-label="Loading detail">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width="2.5rem" height="2.5rem" className="!rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton width="12rem" height="1.25rem" />
          <div className="flex items-center gap-3">
            <Skeleton width="8rem" height="0.875rem" />
            <Skeleton width="4rem" height="0.875rem" />
            <Skeleton width="4rem" height="1.25rem" variant="rectangular" />
          </div>
        </div>
      </div>
      <Skeleton width="100%" height="4.5rem" variant="rectangular" />
      <div className="space-y-2">
        <Skeleton width="8rem" height="1rem" />
        <div className="flex flex-wrap gap-2">
          <Skeleton width="6rem" height="1.75rem" variant="rectangular" className="!rounded-full" />
          <Skeleton width="7rem" height="1.75rem" variant="rectangular" className="!rounded-full" />
          <Skeleton width="5rem" height="1.75rem" variant="rectangular" className="!rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="6rem" height="1rem" />
        <Skeleton width="100%" height="3.5rem" variant="rectangular" />
      </div>
    </Card>
  );
}
