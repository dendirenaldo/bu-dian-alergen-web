'use client';

import { Mail, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';
import { validators } from '@/lib/validation';

interface StepCredentialsProps {
  data: { email: string; password: string; confirmPassword: string };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onError?: (field: string, error: string | undefined) => void;
}

export default function StepCredentials({ data, errors, onChange, onError }: StepCredentialsProps) {
  const handleBlur = (field: string, value: string) => {
    let result;
    if (field === 'email') result = validators.email(value);
    if (field === 'password') result = validators.password(value);
    if (field === 'confirmPassword') result = validators.matchField(data.password, 'Konfirmasi password')(value);
    if (result && !result.valid) {
      onError?.(field, result.error!);
    } else {
      onError?.(field, '');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="Masukkan email"
        leftIcon={<Mail className="h-4 w-4" />}
        value={data.email}
        onChange={(e) => onChange('email', e.target.value)}
        onBlur={(e) => handleBlur('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Masukkan password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={data.password}
        onChange={(e) => onChange('password', e.target.value)}
        onBlur={(e) => handleBlur('password', e.target.value)}
        error={errors.password}
        helperText="Minimal 8 karakter, huruf besar, dan angka"
        autoComplete="new-password"
        required
      />
      <Input
        label="Konfirmasi Password"
        type="password"
        placeholder="Ulangi password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={data.confirmPassword}
        onChange={(e) => onChange('confirmPassword', e.target.value)}
        onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
        required
      />
    </div>
  );
}
