'use client';

import { useState, useEffect, useMemo } from 'react';
import { FolderOpen, Link2, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
import { Category } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useLocale } from '@/contexts/LocaleContext';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSubmit: (data: { name: string; slug?: string; description?: string; imageUrl?: string; sortOrder?: number }) => Promise<void>;
  isSaving?: boolean;
}

export default function CategoryForm({ isOpen, onClose, category, onSubmit, isSaving = false }: CategoryFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '', sortOrder: '0' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = useMemo(() => [form.name, form.slug, form.description, form.imageUrl].some((v) => v !== ''), [form]);
  const guard = useUnsavedGuard(isOpen && dirty && !isSaving);

  useEffect(() => {
    if (category) setForm({ name: category.name || '', slug: category.slug || '', description: category.description || '', imageUrl: category.imageUrl || '', sortOrder: String(category.sortOrder ?? 0) });
    else setForm({ name: '', slug: '', description: '', imageUrl: '', sortOrder: '0' });
    setErrors({});
  }, [category, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const r = validators.required(t('admin.form.categoryName'))(form.name);
    if (!r.valid) errs.name = r.error!;
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug.trim())) errs.slug = t('admin.validation.slugChars');
    if (form.sortOrder && !/^-?\d+$/.test(form.sortOrder.trim())) errs.sortOrder = t('admin.validation.orderInt');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: form.sortOrder.trim() === '' ? undefined : Number(form.sortOrder),
    });
  };

  const handleClose = () => { if (dirty && !isSaving) guard.setShowDialog(true); else onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={category ? t('admin.form.editCategory') : t('admin.form.addCategory')} description={t('admin.form.slugAuto')} size="md">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('admin.form.categoryName')} placeholder={t('admin.form.exCategory')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required leftIcon={<FolderOpen className="h-4 w-4" />} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('admin.form.slug')} placeholder="makanan-ringan" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} leftIcon={<Link2 className="h-4 w-4" />} />
          <Input label={t('admin.form.order')} placeholder="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} error={errors.sortOrder} leftIcon={<ArrowUpDown className="h-4 w-4" />} inputMode="numeric" />
        </div>
        <Input label={t('admin.form.imageUrl')} placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} leftIcon={<ImageIcon className="h-4 w-4" />} inputMode="url" />
        <Textarea label={t('admin.form.description')} placeholder={t('admin.form.descOptional')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={isSaving}>{category ? t('admin.form.save') : t('admin.form.add')}</Button>
        </div>
      </form>
    </Modal>
  );
}
