import { ReactElement } from 'react';
import Head from 'next/head';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Bu Dian</title>
      </Head>
      <PageTransition>
        <LoginForm />
      </PageTransition>
    </>
  );
}

LoginPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
