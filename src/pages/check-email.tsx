import { ReactElement, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MailCheck } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { formatApiErrorMessage } from '@/lib/api';

const COOLDOWN_SECS = 60;

export default function CheckEmailPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { pendingEmail, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const queryEmail = useMemo(() => {
    if (!router.isReady) return '';
    const q = router.query.email;
    return typeof q === 'string' && q.trim() ? q.trim() : '';
  }, [router.isReady, router.query.email]);

  useEffect(() => {
    const resolved = queryEmail || pendingEmail || '';
    if (resolved) setEmail(resolved);
  }, [queryEmail, pendingEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setIsSending(true);
    setNotice('');
    setError('');
    try {
      const msg = await resendVerification(email);
      setNotice(msg || t('auth.check.resent'));
      setCooldown(COOLDOWN_SECS);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <SeoHead title={t('seo.checkTitle')} description={t('seo.checkDesc')} path="/check-email" />
      <PageTransition>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <MailCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {t('auth.check.title')}
            </h2>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {email ? t('auth.check.desc', { email }) : t('auth.check.noEmailDesc')}
            </p>
          </div>

          {notice && (
            <Alert variant="success" title={t('auth.check.title')}>
              {notice}
            </Alert>
          )}
          {error && (
            <Alert variant="error" title={t('auth.check.title')}>
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleResend}
              isLoading={isSending}
              disabled={!email || cooldown > 0}
              className="w-full"
            >
              {cooldown > 0
                ? t('auth.check.resendCooldown', { s: cooldown })
                : t('auth.check.resendCta')}
            </Button>
            <a
              href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email || '')}`}
              target="_blank"
              rel="noreferrer"
              className="block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('auth.check.openEmail')}
            </a>
          </div>

          <p className="text-xs text-surface-500 dark:text-surface-400">{t('auth.check.spamHint')}</p>

          <p className="text-center text-sm text-surface-600 dark:text-surface-400">
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('auth.check.backLogin')}
            </Link>
          </p>
        </div>
      </PageTransition>
    </>
  );
}

CheckEmailPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
