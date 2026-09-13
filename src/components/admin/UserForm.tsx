'use client';

import { useState, useEffect, useMemo } from 'react';
import { User as UserIcon, Mail, Phone, ShieldCheck, Lock } from 'lucide-react';
import { User } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useLocale } from '@/contexts/LocaleContext';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: { name: string; email: string; phone?: string; role: 'admin' | 'user'; password?: string }) => Promise<void>;
  isSaving?: boolean;
}

export default function UserForm({ isOpen, onClose, user, onSubmit, isSaving = false }: UserFormProps) {
  const { t } = useLocale();
  const roleOptions = [
    { value: 'user', label: t('admin.form.roleUser') },
    { value: 'admin', label: t('admin.form.roleAdmin') },
  ];
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user' as 'admin' | 'user', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => [form.name, form.email, form.phone, form.password].some((v) => v !== ''), [form]);
  const guard = useUnsavedGuard(isOpen && dirty && !isSaving);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'user', password: '' });
    } else {
      setForm({ name: '', email: '', phone: '', role: 'user', password: '' });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required(t('admin.form.name'))(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    const emailRequired = validators.required(t('admin.form.email'))(form.email);
    if (!emailRequired.valid) errs.email = emailRequired.error!;
    else {
      const emailFormat = validators.email(form.email);
      if (!emailFormat.valid) errs.email = emailFormat.error!;
    }
    if (form.phone) {
      const phoneResult = validators.phone(form.phone);
      if (!phoneResult.valid) errs.phone = phoneResult.error!;
    }
    // Wajib isi password saat tambah; opsional saat ubah (tetap divalidasi bila diisi).
    if (!user && !form.password) {
      errs.password = t('admin.validation.required', { field: t('admin.form.password') });
    } else if (form.password) {
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
    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      password: form.password || undefined,
    });
  };

  const handleClose = () => {
    if (dirty && !isSaving) guard.setShowDialog(true);
    else onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={user ? t('admin.form.editUser') : t('admin.form.addUser')} size="md">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('admin.form.name')} placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required autoComplete="name" leftIcon={<UserIcon className="h-4 w-4" />} />
        <Input label={t('admin.form.email')} type="email" placeholder="nama@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required autoComplete="email" leftIcon={<Mail className="h-4 w-4" />} />
        <Input label={t('admin.form.phone')} placeholder={t('admin.form.exPhone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} autoComplete="tel" leftIcon={<Phone className="h-4 w-4" />} inputMode="tel" />
        <Select label={t('admin.form.role')} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })} options={roleOptions} required />
        <Input label={user ? t('admin.form.newPassword') : t('admin.form.password')} type="password" placeholder={user ? t('admin.form.passwordEmpty') : t('admin.form.passwordHint')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} required={!user} autoComplete="new-password" leftIcon={<Lock className="h-4 w-4" />} helperText={t('admin.form.passwordHint')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={isSaving}>{user ? t('admin.form.save') : t('admin.form.add')}</Button>
        </div>
      </form>
    </Modal>
  );
}
