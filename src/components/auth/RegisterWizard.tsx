'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import StepIndicator from './StepIndicator';
import StepPersonalInfo from './StepPersonalInfo';
import StepCredentials from './StepCredentials';
import StepConfirmation from './StepConfirmation';
import { validators } from '@/lib/validation';
import { useLocale } from '@/contexts/LocaleContext';

export default function RegisterWizard() {
  const { t } = useLocale();
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [personalInfo, setPersonalInfo] = useState({ name: '', phone: '' });
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const nameResult = validators.required(t('auth.form.name'))(personalInfo.name);
      if (!nameResult.valid) newErrors.name = nameResult.error!;

      const phoneResult = validators.phone(personalInfo.phone);
      if (!phoneResult.valid) newErrors.phone = phoneResult.error!;
    }

    if (step === 2) {
      const emailResult = validators.email(credentials.email);
      if (!emailResult.valid) newErrors.email = emailResult.error!;

      const passwordResult = validators.password(credentials.password);
      if (!passwordResult.valid) newErrors.password = passwordResult.error!;

      const confirmResult = validators.matchField(credentials.password, t('auth.form.confirmPassword'))(
        credentials.confirmPassword
      );
      if (!confirmResult.valid) newErrors.confirmPassword = confirmResult.error!;
    }

    if (step === 3) {
      if (!agreeToTerms) newErrors.terms = 'Anda harus menyetujui syarat & ketentuan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setApiError('');
    try {
      const user = await register({
        name: personalInfo.name,
        email: credentials.email,
        password: credentials.password,
        phone: personalInfo.phone || undefined,
      });
      router.push(user?.role === 'admin' ? '/admin' : '/detect');
    } catch (err: any) {
      setApiError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enter → lanjut / daftar (dukungan keyboard).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step < 3) handleNext();
      else handleSubmit();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); step < 3 ? handleNext() : handleSubmit(); }} onKeyDown={handleKeyDown}>
      <StepIndicator currentStep={step} totalSteps={3} />

      {apiError && <div className="mb-4"><Alert variant="error" title="Registrasi gagal">{apiError}</Alert></div>}

      {step === 1 && (
        <StepPersonalInfo
          data={personalInfo}
          errors={errors}
          onChange={(field, value) => setPersonalInfo({ ...personalInfo, [field]: value })}
          onError={(field, error) => setErrors(prev => ({ ...prev, [field]: error || '' }))}
        />
      )}

      {step === 2 && (
        <StepCredentials
          data={credentials}
          errors={errors}
          onChange={(field, value) => setCredentials({ ...credentials, [field]: value })}
          onError={(field, error) => setErrors(prev => ({ ...prev, [field]: error || '' }))}
        />
      )}

      {step === 3 && (
        <StepConfirmation
          data={{ ...personalInfo, email: credentials.email }}
          agreeToTerms={agreeToTerms}
          onToggleTerms={() => setAgreeToTerms(!agreeToTerms)}
          errors={errors}
        />
      )}

      <div className="mt-6 flex gap-3">
        {step > 1 && (
          <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={handleNext} className="flex-1">
            Selanjutnya
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} isLoading={isLoading} className="flex-1">
            Daftar
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-surface-600 dark:text-surface-400">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Login
        </Link>
      </p>
    </form>
  );
}
