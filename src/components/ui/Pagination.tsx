import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors',
          'text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPageNumbers().map((page, i) =>
        typeof page === 'string' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-1 text-sm text-surface-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors',
          'text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
