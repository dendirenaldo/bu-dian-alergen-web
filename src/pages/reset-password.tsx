import { ReactElement, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Lock } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { validators } from '@/lib/validation';
import { authService } from '@/lib/auth';
import { formatApiErrorMessage } from '@/lib/api';

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.token;
    setToken(typeof q === 'string' && q.trim() ? q.trim() : null);
  }, [router.isReady, router.query.token]);

  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => router.replace('/login'), 2000);
    return () => clearTimeout(timer);
  }, [isDone, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const passResult = validators.password(form.newPassword);
    if (!passResult.valid) errs.newPassword = passResult.error!;
    const confirmResult = validators.matchField(form.newPassword, t('auth.form.confirmPassword'))(
      form.confirmPassword,
    );
    if (!confirmResult.valid) errs.confirmPassword = confirmResult.error!;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!token) {
      setApiError(t('auth.resetNoToken'));
      return;
    }
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.resetPassword(token, form.newPassword);
      setIsDone(true);
    } catch (err) {
      setApiError(formatApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SeoHead title={t('seo.resetTitle')} description={t('seo.resetDesc')} path="/reset-password" />
      <PageTransition>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {t('auth.resetTitle')}
            </h2>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {t('auth.resetDesc')}
            </p>
          </div>

          {isDone ? (
            <Alert variant="success" title={t('auth.resetTitle')}>
              {t('auth.resetSuccess')}
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <Alert variant="error" title={t('auth.resetTitle')}>
                  {apiError}
                </Alert>
              )}
              {!router.isReady ? null : !token ? (
                <Alert variant="warning" title={t('auth.resetTitle')}>
                  {t('auth.resetNoToken')}{' '}
                  <Link
                    href="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {t('auth.forgotCta')}
                  </Link>
                </Alert>
              ) : (
                <>
                  <Input
                    label={t('auth.newPassword')}
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    error={errors.newPassword}
                    required
                    autoComplete="new-password"
                    helperText={t('admin.form.passwordHint')}
                  />
                  <PasswordStrength password={form.newPassword} />
                  <Input
                    label={t('auth.form.confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    required
                    autoComplete="new-password"
                  />
                  <Button type="submit" isLoading={isLoading} className="w-full">
                    {t('auth.resetCta')}
                  </Button>
                </>
              )}
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

ResetPasswordPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
