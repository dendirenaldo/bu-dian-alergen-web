import { ReactElement, useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import SeoHead from '@/components/shared/SeoHead';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/lib/auth';
import { formatApiErrorMessage } from '@/lib/api';
import { validators } from '@/lib/validation';
import { User as UserIcon } from 'lucide-react';
import type { User } from '@/types';

export default function ProfilePage() {
  const { t } = useLocale();
  const { token, user, setUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', avatarUrl: '' });
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token || loaded) return;
    setIsLoading(true);
    authService
      .getProfile(token)
      .then((res) => {
        const u = (res as { data?: User })?.data;
        if (u) {
          setUser(u);
          setForm({ name: u.name || '', phone: u.phone || '', avatarUrl: u.avatarUrl || '' });
        }
        setLoaded(true);
      })
      .catch((err) => setApiError(formatApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [token, loaded, setUser]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required(t('profile.name'))(form.name.trim());
    if (!nameResult.valid) errs.name = nameResult.error!;
    else if (form.name.trim().length < 2) errs.name = t('profile.nameMin');
    if (form.phone.trim()) {
      const phoneResult = validators.phone(form.phone.trim());
      if (!phoneResult.valid) errs.phone = phoneResult.error!;
    }
    if (form.avatarUrl.trim()) {
      try {
        const u = new URL(form.avatarUrl.trim());
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad');
      } catch {
        errs.avatarUrl = t('profile.avatarInvalid');
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    if (!token) {
      setApiError(t('api.err.session'));
      return;
    }
    setIsSaving(true);
    try {
      const res = await authService.updateProfile(
        { name: form.name.trim(), phone: form.phone.trim(), avatarUrl: form.avatarUrl.trim() || undefined },
        token,
      );
      const updated = (res as { data?: User })?.data;
      if (updated) setUser(updated);
      toast(t('profile.saved'));
    } catch (err) {
      const msg = formatApiErrorMessage(err);
      setApiError(msg);
      toast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SeoHead title={t('profile.title')} description={t('profile.desc')} path="/profile" />
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-xl space-y-6">
            <div className="space-y-2">
              <Breadcrumb items={[{ label: t('profile.title') }]} />
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {t('profile.title')}
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {t('profile.desc')}
              </p>
            </div>
            <Card padding="md">
              {isLoading ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">{t('common.loading')}</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {apiError && (
                    <Alert variant="error" title={t('profile.title')}>
                      {apiError}
                    </Alert>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-50 px-3.5 py-2.5 dark:bg-surface-800">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name || 'Avatar'} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          <UserIcon className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{user.name}</p>
                        <p className="truncate text-xs text-surface-500 dark:text-surface-400">{user.email}</p>
                      </div>
                    </div>
                  )}
                  <Input
                    label={t('profile.name')}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={errors.name}
                    required
                  />
                  <Input
                    label={t('profile.phone')}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    error={errors.phone}
                    placeholder={t('profile.phonePh')}
                  />
                  <Input
                    label={t('profile.avatar')}
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                    error={errors.avatarUrl}
                    placeholder="https://…"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isSaving}>
                      {t('common.save')}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

ProfilePage.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>;
