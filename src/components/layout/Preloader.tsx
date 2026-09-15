import { dicts, getActiveLocale } from '@/lib/i18n';

export default function Preloader() {
  const locale = getActiveLocale();
  const label = dicts[locale]['common.loading'] ?? 'Loading...';
  return (
    <div
      id="preloader"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-surface-950"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
      </div>
    </div>
  );
}
