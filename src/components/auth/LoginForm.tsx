'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { validators } from '@/lib/validation';
import { useLocale } from '@/contexts/LocaleContext';

export default function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleBlur = (field: string, value: string) => {
    let result;
    if (field === 'email') result = validators.email(value);
    if (field === 'password') result = validators.required(t('auth.form.password'))(value);
    if (result && !result.valid) {
      setErrors(prev => ({ ...prev, [field]: result!.error! }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = validators.email(form.email);
    if (!emailResult.valid) newErrors.email = emailResult.error!;

    const passwordResult = validators.required(t('auth.form.password'))(form.password);
    if (!passwordResult.valid) newErrors.password = passwordResult.error!;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push(user?.role === 'admin' ? '/admin' : '/detect');
    } catch (err: any) {
      setApiError(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <Alert variant="error" title="Login gagal">{apiError}</Alert>}

      <Input
        label={t('auth.form.email')}
        type="email"
        placeholder="Masukkan email"
        leftIcon={<Mail className="h-4 w-4" />}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        onBlur={(e) => handleBlur('email', e.target.value)}
        error={errors.email}
        required
        autoComplete="email"
      />

      <Input
        label={t('auth.form.password')}
        type="password"
        placeholder="Masukkan password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        onBlur={(e) => handleBlur('password', e.target.value)}
        error={errors.password}
        required
        autoComplete="current-password"
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        Login
      </Button>

      <p className="text-center text-sm text-surface-600 dark:text-surface-400">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
