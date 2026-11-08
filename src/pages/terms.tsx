import { ReactElement } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import LegalPage from '@/components/legal/LegalPage';
import { useLocale } from '@/contexts/LocaleContext';

export default function TermsPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('terms.title')} description={t('terms.subtitle')} path="/terms" />
      <PageTransition>
        <LegalPage
          slug="terms"
          titleKey="terms.title"
          subtitleKey="terms.subtitle"
          updatedKey="terms.updated"
          emptyKey="terms.empty"
        />
      </PageTransition>
    </>
  );
}

TermsPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
