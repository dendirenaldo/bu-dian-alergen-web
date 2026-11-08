import Link from 'next/link';
import { useAppName, useAppInitials } from '@/contexts/AppConfigContext';
import { useLocale } from '@/contexts/LocaleContext';

export default function Footer() {
  const appName = useAppName();
  const appInitials = useAppInitials();
  const { t } = useLocale();
  return (
    <footer className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-white font-bold text-xs">{appInitials}</div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {appName}
            </span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            &copy; {new Date().getFullYear()} {appName}. {t('footer.rights')}
          </p>
          <nav aria-label={t('common.toc')} className="flex items-center gap-4 text-sm">
            <Link
              href="/terms"
              className="text-surface-500 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400"
            >
              {t('terms.title')}
            </Link>
            <Link
              href="/privacy"
              className="text-surface-500 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400"
            >
              {t('privacy.title')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
