import { ReactElement } from 'react';
import Head from 'next/head';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import StatsSection from '@/components/home/StatsSection';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Bu Dian - Sistem Deteksi Alergen Makanan</title>
        <meta
          name="description"
          content="Deteksi alergen pada produk makanan menggunakan teknologi AI Word2Vec dan BiLSTM."
        />
      </Head>
      <PageTransition>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection />
      </PageTransition>
    </>
  );
}

HomePage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
