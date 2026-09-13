import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DetectionProvider } from '@/contexts/DetectionContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AppPropsWithLayout } from '@/layouts/types';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <ThemeProvider>
        <LocaleProvider>
          <ToastProvider>
            <AuthProvider>
              <DetectionProvider>
                {getLayout(<Component {...pageProps} />)}
              </DetectionProvider>
            </AuthProvider>
          </ToastProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  );
}
