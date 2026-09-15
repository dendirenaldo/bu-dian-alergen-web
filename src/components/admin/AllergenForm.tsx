'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Code2, Palette, FileText } from 'lucide-react';
import { Allergen, AllergenSeverity } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useLocale } from '@/contexts/LocaleContext';

interface AllergenFormProps {
  isOpen: boolean;
  onClose: () => void;
  allergen?: Allergen | null;
  onSubmit: (data: { name: string; code: string; description?: string; severityLevel: AllergenSeverity; color?: string }) => Promise<void>;
  isSaving?: boolean;
}

export default function AllergenForm({ isOpen, onClose, allergen, onSubmit, isSaving = false }: AllergenFormProps) {
  const { t } = useLocale();
  const severityOptions = [
    { value: 'low', label: t('admin.severity.low') },
    { value: 'medium', label: t('admin.severity.medium') },
    { value: 'high', label: t('admin.severity.high') },
    { value: 'critical', label: t('admin.severity.critical') },
  ];
  const [form, setForm] = useState({ name: '', code: '', description: '', severityLevel: 'medium' as AllergenSeverity, color: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => [form.name, form.code, form.description, form.color, form.severityLevel !== 'medium'].some((v) => v === true || (typeof v === 'string' && v !== '')), [form]);
  const guard = useUnsavedGuard(isOpen && dirty && !isSaving);

  useEffect(() => {
    if (allergen) {
      setForm({ name: allergen.name || '', code: allergen.code || '', description: allergen.description || '', severityLevel: allergen.severityLevel || 'medium', color: allergen.color || '' });
    } else {
      setForm({ name: '', code: '', description: '', severityLevel: 'medium', color: '' });
    }
    setErrors({});
  }, [allergen, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required(t('admin.form.allergenName'))(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    if (!form.code.trim()) errs.code = t('admin.validation.required', { field: t('admin.form.code') });
    else if (!/^[A-Z0-9_]+$/.test(form.code.trim().toUpperCase())) errs.code = t('admin.validation.codeChars');
    if (form.color && !/^#[0-9a-fA-F]{6}$/.test(form.color.trim())) errs.color = t('admin.validation.hexColor');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      severityLevel: form.severityLevel,
      color: form.color.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (dirty && !isSaving) guard.setShowDialog(true);
    else onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={allergen ? t('admin.form.editAllergen') : t('admin.form.addAllergen')} size="md">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('admin.form.allergenName')} placeholder={t('admin.form.exAllergen')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required leftIcon={<AlertTriangle className="h-4 w-4" />} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('admin.form.code')} placeholder={t('admin.form.exCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} required leftIcon={<Code2 className="h-4 w-4" />} helperText={t('admin.form.codeHint')} />
          <Input label={t('admin.form.color')} placeholder="#EF4444" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} error={errors.color} leftIcon={<Palette className="h-4 w-4" />} />
        </div>
        <Select label={t('admin.form.severity')} value={form.severityLevel} onChange={(e) => setForm({ ...form, severityLevel: e.target.value as AllergenSeverity })} options={severityOptions} required />
        <Textarea label={t('admin.form.description')} placeholder={t('admin.form.descOptional')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={isSaving}>{allergen ? t('admin.form.save') : t('admin.form.add')}</Button>
        </div>
      </form>
    </Modal>
  );
}
