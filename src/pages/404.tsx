import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import type { ReactElement } from 'react';

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title="404" description={t('error404.desc')} path="/404" noIndex />
      <div className="page-container text-center">
        <p className="text-6xl font-bold text-surface-900 dark:text-surface-100">404</p>
        <h1 className="mt-4 text-2xl font-bold text-surface-900 dark:text-surface-100">
          {t('error404.title')}
        </h1>
        <p className="mt-2 text-surface-600 dark:text-surface-400">{t('error404.desc')}</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {t('error404.back')}
          </Link>
        </div>
      </div>
    </>
  );
}

NotFoundPage.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>;
