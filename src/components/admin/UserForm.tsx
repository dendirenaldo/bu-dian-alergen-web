'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: {
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'user';
    password?: string;
  }) => Promise<void>;
}

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export default function UserForm({ isOpen, onClose, user, onSubmit }: UserFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'user',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        password: '',
      });
    } else {
      setForm({ name: '', email: '', phone: '', role: 'user', password: '' });
    }
  }, [user, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required('Nama')(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    const emailRequired = validators.required('Email')(form.email);
    if (!emailRequired.valid) errs.email = emailRequired.error!;
    else {
      const emailFormat = validators.email(form.email);
      if (!emailFormat.valid) errs.email = emailFormat.error!;
    }
    if (form.phone) {
      const phoneResult = validators.phone(form.phone);
      if (!phoneResult.valid) errs.phone = phoneResult.error!;
    }
    if (!user && form.password) {
      const passResult = validators.password(form.password);
      if (!passResult.valid) errs.password = passResult.error!;
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Tambah User'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama"
          placeholder="Masukkan nama"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="Masukkan email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          required
        />
        <Input
          label="Telepon"
          placeholder="Masukkan nomor telepon"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={errors.phone}
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}
          options={roleOptions}
        />
        <Input
          label={user ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
          type="password"
          placeholder="Masukkan password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required={!user}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {user ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
