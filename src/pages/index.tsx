import { ReactElement } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';

export default function HomePage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('seo.homeTitle')} description={t('seo.homeDesc')} path="/" />
      <PageTransition>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </PageTransition>
    </>
  );
}

HomePage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
