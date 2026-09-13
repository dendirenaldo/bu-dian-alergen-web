import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DetectionProvider } from '@/contexts/DetectionContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AppConfigProvider } from '@/contexts/AppConfigContext';
import { AppPropsWithLayout } from '@/layouts/types';

import { jakarta } from '@/lib/fonts';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <style jsx global>{`
        :root {
          --font-sans: ${jakarta.style.fontFamily};
        }
        body {
          font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
        }
      `}</style>
      <ThemeProvider>
        <LocaleProvider>
          <AppConfigProvider>
          <ToastProvider>
            <AuthProvider>
              <DetectionProvider>
                {getLayout(<Component {...pageProps} />)}
              </DetectionProvider>
            </AuthProvider>
          </ToastProvider>
          </AppConfigProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  );
}
