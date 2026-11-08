'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

/** Bar progres di tepi atas saat berpindah halaman (3px, tanpa spinner). */
export default function PageLoadingBar() {
  const router = useRouter();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 });

    const start = () => {
      NProgress.start();
      // Bar murni dekoratif: sembunyikan dari assistive technology.
      // Div #nprogress dibuat lazily oleh lib saat start() pertama,
      // jadi atribut dipasang ulang setiap start.
      document.getElementById('nprogress')?.setAttribute('aria-hidden', 'true');
    };
    const stop = () => {
      NProgress.done();
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', stop);
    router.events.on('routeChangeError', stop);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', stop);
      router.events.off('routeChangeError', stop);
      NProgress.done();
    };
  }, [router]);

  return null;
}
