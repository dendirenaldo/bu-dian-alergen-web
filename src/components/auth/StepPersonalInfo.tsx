'use client';

import { User, Phone } from 'lucide-react';
import Input from '@/components/ui/Input';
import { validators } from '@/lib/validation';
import { useLocale } from '@/contexts/LocaleContext';

interface StepPersonalInfoProps {
  data: { name: string; phone: string };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onError?: (field: string, error: string | undefined) => void;
}

export default function StepPersonalInfo({ data, errors, onChange, onError }: StepPersonalInfoProps) {
  const { t } = useLocale();
  const handleBlur = (field: string, value: string) => {
    let result;
    if (field === 'name') result = validators.required(t('auth.form.name'))(value);
    if (field === 'phone') result = validators.phone(value);
    if (result && !result.valid) {
      onError?.(field, result.error!);
    } else {
      onError?.(field, '');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label={t('auth.form.name')}
        placeholder="Masukkan nama lengkap"
        leftIcon={<User className="h-4 w-4" />}
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        onBlur={(e) => handleBlur('name', e.target.value)}
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        label={t('auth.form.phone')}
        placeholder="Masukkan nomor telepon"
        leftIcon={<Phone className="h-4 w-4" />}
        value={data.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        onBlur={(e) => handleBlur('phone', e.target.value)}
        error={errors.phone}
        autoComplete="tel"
      />
    </div>
  );
}
