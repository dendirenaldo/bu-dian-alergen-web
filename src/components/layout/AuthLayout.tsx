import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAppName, useAppInitials } from '@/contexts/AppConfigContext';
import { useLocale } from '@/contexts/LocaleContext';
import Card from '@/components/ui/Card';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const appName = useAppName();
  const appInitials = useAppInitials();
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12 dark:bg-surface-950">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('auth.backHome')}
        </Link>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white font-bold text-lg">{appInitials}</div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {appName}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Sistem Deteksi Alergen Makanan
          </p>
        </div>
        <Card padding="md">
          {children}
        </Card>
      </div>
    </div>
  );
}
