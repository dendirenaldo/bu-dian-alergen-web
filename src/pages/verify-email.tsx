import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { isApiError, formatApiErrorMessage } from '@/lib/api';

type Status = 'pending' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.token;
    setToken(typeof q === 'string' && q.trim() ? q.trim() : null);
  }, [router.isReady, router.query.token]);

  const doVerify = useCallback(
    async (tk: string) => {
      setStatus('verifying');
      setMessage('');
      setCode(undefined);
      try {
        const msg = await verifyEmail(tk);
        setStatus('success');
        setMessage(msg || t('auth.verify.success'));
      } catch (err) {
        setStatus('error');
        setMessage(formatApiErrorMessage(err, 'auth.verify.failed'));
        if (isApiError(err)) setCode(err.code);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verifyEmail],
  );
  const verifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (token) {
      if (verifiedRef.current === token) return;
      verifiedRef.current = token;
      void doVerify(token);
    } else {
      setStatus('error');
    }
  }, [router.isReady, token, doVerify]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsResending(true);
    setResendMsg('');
    try {
      const msg = await resendVerification(email.trim());
      setResendMsg(msg || t('auth.verify.resent'));
    } catch (err) {
      setResendMsg(formatApiErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  const isExpired = code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN';

  return (
    <>
      <SeoHead title={t('seo.verifyTitle')} description={t('seo.verifyDesc')} path="/verify-email" />
      <PageTransition>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {t('auth.verify.title')}
            </h2>
          </div>

          {(status === 'pending' || status === 'verifying') && (
            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('auth.verify.verifying')}
            </div>
          )}

          {status === 'success' && (
            <Alert variant="success" title={t('auth.verify.title')}>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {message || t('auth.verify.success')}
              </span>
            </Alert>
          )}

          {status === 'error' && !token && (
            <Alert variant="warning" title={t('auth.verify.title')}>
              {t('auth.verify.noToken')}
            </Alert>
          )}

          {status === 'error' && !!token && (
            <Alert variant="error" title={t('auth.verify.failed')}>
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {isExpired ? t('auth.verify.expired') : message}
              </span>
            </Alert>
          )}

          {status === 'success' && (
            <Link href="/login">
              <Button className="w-full">{t('auth.verify.loginCta')}</Button>
            </Link>
          )}

          {(status === 'error') && (
            <form onSubmit={handleResend} className="space-y-3">
              <Input
                label={t('auth.form.email')}
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Button type="submit" isLoading={isResending} className="w-full" disabled={!email.trim()}>
                {t('auth.verify.resendCta')}
              </Button>
              {resendMsg && (
                <Alert variant="success" title={t('auth.verify.resendCta')}>
                  {resendMsg}
                </Alert>
              )}
            </form>
          )}

          <p className="text-center text-sm text-surface-600 dark:text-surface-400">
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('auth.verify.backLogin')}
            </Link>
          </p>
        </div>
      </PageTransition>
    </>
  );
}

VerifyEmailPage.getLayout = (page: ReactElement) => {
  return <AuthLayout>{page}</AuthLayout>;
};
