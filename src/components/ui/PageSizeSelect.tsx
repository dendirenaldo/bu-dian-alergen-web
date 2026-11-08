'use client';

import { useLocale } from '@/contexts/LocaleContext';
import Dropdown from '@/components/ui/Dropdown';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface PageSizeSelectProps {
  value: number;
  onChange: (size: number) => void;
}

export default function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  const { t } = useLocale();
  return (
    <label className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
      <span className="whitespace-nowrap">{t('pagination.perPage')}</span>
      <Dropdown
        onSelect={(id) => {
          const n = Number(id);
          if (Number.isFinite(n) && n > 0) onChange(n);
        }}
        trigger={
          <span className="inline-flex min-w-[4.5rem] items-center justify-between gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors">
            {value}
            <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2.5 4.5 6 7.5 9.5 4.5" />
            </svg>
          </span>
        }
        items={PAGE_SIZE_OPTIONS.map((n) => ({ id: String(n), label: String(n) }))}
      />
    </label>
  );
}
