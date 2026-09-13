import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="flex items-center gap-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
        aria-label="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? 'page' : undefined}
                className={last ? 'font-medium text-surface-900 dark:text-surface-100' : 'text-surface-500'}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
