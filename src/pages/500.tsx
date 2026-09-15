import PublicLayout from '@/components/layout/PublicLayout';
import SeoHead from '@/components/shared/SeoHead';
import Button from '@/components/ui/Button';
import { useLocale } from '@/contexts/LocaleContext';
import type { ReactElement } from 'react';

export default function ErrorPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title="500" description={t('error500.desc')} path="/500" noIndex />
      <div className="page-container text-center">
        <p className="text-6xl font-bold text-surface-900 dark:text-surface-100">500</p>
        <h1 className="mt-4 text-2xl font-bold text-surface-900 dark:text-surface-100">
          {t('error500.title')}
        </h1>
        <p className="mt-2 text-surface-600 dark:text-surface-400">{t('error500.desc')}</p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>{t('error500.retry')}</Button>
        </div>
      </div>
    </>
  );
}

ErrorPage.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>;
