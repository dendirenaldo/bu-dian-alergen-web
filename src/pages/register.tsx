import { ReactElement } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import RegisterWizard from '@/components/auth/RegisterWizard';

export default function RegisterPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('seo.registerTitle')} description={t('seo.registerDesc')} path="/register" />
      <PageTransition>
        <RegisterWizard />
      </PageTransition>
    </>
  );
}

RegisterPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
