import Head from 'next/head';
import { useAppName } from '@/contexts/AppConfigContext';

interface SeoHeadProps {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

const SITE_URL = 'https://researchcomnets.ilkom.unsri.ac.id';

export default function SeoHead({ title, description, path = '/', noIndex = false }: SeoHeadProps) {
  const appName = useAppName();
  const fullTitle = `${title} - ${appName}`;
  const canonical = `${SITE_URL}${path}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={appName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
}
