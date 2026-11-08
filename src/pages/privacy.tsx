import { ReactElement } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import LegalPage from '@/components/legal/LegalPage';
import { useLocale } from '@/contexts/LocaleContext';

export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('privacy.title')} description={t('privacy.subtitle')} path="/privacy" />
      <PageTransition>
        <LegalPage
          slug="privacy"
          titleKey="privacy.title"
          subtitleKey="privacy.subtitle"
          updatedKey="privacy.updated"
          emptyKey="privacy.empty"
        />
      </PageTransition>
    </>
  );
}

PrivacyPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
