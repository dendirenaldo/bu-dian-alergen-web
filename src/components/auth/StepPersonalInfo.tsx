'use client';

import { User, Phone } from 'lucide-react';
import Input from '@/components/ui/Input';

interface StepPersonalInfoProps {
  data: { name: string; phone: string };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function StepPersonalInfo({ data, errors, onChange }: StepPersonalInfoProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nama Lengkap"
        placeholder="Masukkan nama lengkap"
        leftIcon={<User className="h-4 w-4" />}
        value={data.name}
        onChange={(e) => onChange('name', e.target.value)}
        error={errors.name}
      />
      <Input
        label="Nomor Telepon (Opsional)"
        placeholder="Masukkan nomor telepon"
        leftIcon={<Phone className="h-4 w-4" />}
        value={data.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        error={errors.phone}
      />
    </div>
  );
}
