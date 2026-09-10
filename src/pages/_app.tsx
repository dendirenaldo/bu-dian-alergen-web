import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DetectionProvider } from '@/contexts/DetectionContext';
import { AppPropsWithLayout } from '@/layouts/types';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <DetectionProvider>
            {getLayout(<Component {...pageProps} />)}
          </DetectionProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
