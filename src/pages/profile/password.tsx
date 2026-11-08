import { ReactElement, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import SeoHead from '@/components/shared/SeoHead';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validators } from '@/lib/validation';
import { authService } from '@/lib/auth';
import { formatApiErrorMessage } from '@/lib/api';
import { Lock } from 'lucide-react';

export default function ChangePasswordPage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    const currentResult = validators.required(t('auth.currentPassword'))(form.currentPassword);
    if (!currentResult.valid) errs.currentPassword = currentResult.error!;
    const passResult = validators.password(form.newPassword);
    if (!passResult.valid) errs.newPassword = passResult.error!;
    else if (form.newPassword === form.currentPassword) {
      errs.newPassword = t('validation.mismatch');
    }
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
    setIsDone(false);
    if (!validate()) return;
    if (!token) {
      setApiError(t('api.err.session'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.changePassword(form.currentPassword, form.newPassword, token);
      const msg =
        (res as { message?: string })?.message || t('auth.changeSuccess');
      toast(msg);
      setIsDone(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setApiError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title={t('seo.changePasswordTitle')}
        description={t('seo.changePasswordDesc')}
        path="/profile/password"
      />
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-xl space-y-6">
            <div className="space-y-2">
              <Breadcrumb items={[{ label: t('auth.changeTitle') }]} />
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {t('auth.changeTitle')}
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t('auth.changeDesc')}
              </p>
            </div>
            <Card padding="md">
              {isDone && (
                <div className="mb-4">
                  <Alert variant="success" title={t('auth.changeTitle')}>
                    {t('auth.changeSuccess')}
                  </Alert>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                  <Alert variant="error" title={t('auth.changeTitle')}>
                    {apiError}
                  </Alert>
                )}
                <Input
                  label={t('auth.currentPassword')}
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  error={errors.currentPassword}
                  required
                  autoComplete="current-password"
                />
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
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isLoading}>
                    {t('auth.changeCta')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

ChangePasswordPage.getLayout = (page: ReactElement) => {
  return (
    <PublicLayout>
      <ProtectedRoute>{page}</ProtectedRoute>
    </PublicLayout>
  );
};
