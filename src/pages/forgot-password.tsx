import { ReactElement, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { validators } from '@/lib/validation';
import { authService } from '@/lib/auth';
import { formatApiErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const emailRequired = validators.required(t('auth.forgotEmail'))(email);
    if (!emailRequired.valid) {
      setError(emailRequired.error!);
      return;
    }
    const emailFormat = validators.email(email);
    if (!emailFormat.valid) {
      setError(emailFormat.error!);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setIsSent(true);
    } catch (err) {
      setApiError(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SeoHead title={t('seo.forgotTitle')} description={t('seo.forgotDesc')} path="/forgot-password" />
      <PageTransition>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {t('auth.forgotTitle')}
            </h2>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {t('auth.forgotDesc')}
            </p>
          </div>

          {isSent ? (
            <Alert variant="success" title={t('auth.forgotSuccess')}>
              {t('auth.forgotSuccess')}
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <Alert variant="error" title={t('auth.forgotTitle')}>
                  {apiError}
                </Alert>
              )}
              <Input
                label={t('auth.forgotEmail')}
                type="email"
                placeholder="nama@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
                autoComplete="email"
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                {t('auth.forgotCta')}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-surface-600 dark:text-surface-400">
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('auth.forgotBack')}
            </Link>
          </p>
        </div>
      </PageTransition>
    </>
  );
}

ForgotPasswordPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
