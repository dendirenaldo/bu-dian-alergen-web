import { ReactElement } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('seo.loginTitle')} description={t('seo.loginDesc')} path="/login" />
      <PageTransition>
        <LoginForm />
      </PageTransition>
    </>
  );
}

LoginPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
