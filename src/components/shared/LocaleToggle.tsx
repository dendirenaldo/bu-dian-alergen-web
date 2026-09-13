import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export default function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={cn('flex items-center rounded-lg border border-surface-200 text-xs font-medium dark:border-surface-700', className)} role="group" aria-label="Language">
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'px-2.5 py-1.5 uppercase transition-colors first:rounded-l-lg last:rounded-r-lg',
            locale === l
              ? 'bg-primary-600 text-white'
              : 'text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
