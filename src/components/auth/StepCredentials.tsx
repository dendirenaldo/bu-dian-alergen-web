'use client';

import { Mail, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';

interface StepCredentialsProps {
  data: { email: string; password: string; confirmPassword: string };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function StepCredentials({ data, errors, onChange }: StepCredentialsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="Masukkan email"
        leftIcon={<Mail className="h-4 w-4" />}
        value={data.email}
        onChange={(e) => onChange('email', e.target.value)}
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Masukkan password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={data.password}
        onChange={(e) => onChange('password', e.target.value)}
        error={errors.password}
        helperText="Minimal 8 karakter, huruf besar, dan angka"
      />
      <Input
        label="Konfirmasi Password"
        type="password"
        placeholder="Ulangi password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={data.confirmPassword}
        onChange={(e) => onChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
      />
    </div>
  );
}
