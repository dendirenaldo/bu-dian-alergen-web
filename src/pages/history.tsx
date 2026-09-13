import { ReactElement } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import Card from '@/components/ui/Card';
import DetectionHistoryTable from '@/components/detection/DetectionHistoryTable';
import { History } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function HistoryPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('seo.historyTitle')} description={t('seo.historyDesc')} path="/history" />
      <PageTransition>
        <div className="page-container">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {t('history.title')}
                </h1>
                <p className="text-surface-500 dark:text-surface-400">
                  {t('history.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <Card padding="md">
            <DetectionHistoryTable />
          </Card>
        </div>
      </PageTransition>
    </>
  );
}

HistoryPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
