import { ReactElement } from 'react';
import Head from 'next/head';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import RegisterWizard from '@/components/auth/RegisterWizard';

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Register - Bu Dian</title>
      </Head>
      <PageTransition>
        <RegisterWizard />
      </PageTransition>
    </>
  );
}

RegisterPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
