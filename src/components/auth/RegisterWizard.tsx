'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import StepIndicator from './StepIndicator';
import StepPersonalInfo from './StepPersonalInfo';
import StepCredentials from './StepCredentials';
import StepConfirmation from './StepConfirmation';
import { validators } from '@/lib/validation';

export default function RegisterWizard() {
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
      const nameResult = validators.required('Nama')(personalInfo.name);
      if (!nameResult.valid) newErrors.name = nameResult.error!;

      const phoneResult = validators.phone(personalInfo.phone);
      if (!phoneResult.valid) newErrors.phone = phoneResult.error!;
    }

    if (step === 2) {
      const emailResult = validators.email(credentials.email);
      if (!emailResult.valid) newErrors.email = emailResult.error!;

      const passwordResult = validators.password(credentials.password);
      if (!passwordResult.valid) newErrors.password = passwordResult.error!;

      const confirmResult = validators.matchField(credentials.password, 'Konfirmasi password')(
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
      await register({
        name: personalInfo.name,
        email: credentials.email,
        password: credentials.password,
        phone: personalInfo.phone || undefined,
      });
      router.push('/');
    } catch (err: any) {
      setApiError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <StepIndicator currentStep={step} totalSteps={3} />

      {apiError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {apiError}
        </div>
      )}

      {step === 1 && (
        <StepPersonalInfo
          data={personalInfo}
          errors={errors}
          onChange={(field, value) => setPersonalInfo({ ...personalInfo, [field]: value })}
        />
      )}

      {step === 2 && (
        <StepCredentials
          data={credentials}
          errors={errors}
          onChange={(field, value) => setCredentials({ ...credentials, [field]: value })}
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
    </div>
  );
}
