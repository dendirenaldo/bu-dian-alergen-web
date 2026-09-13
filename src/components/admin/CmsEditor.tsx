'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heading3, Link2, AlignLeft } from 'lucide-react';
import { Content, ContentType, ContentStatus } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useLocale } from '@/contexts/LocaleContext';

interface CmsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content?: Content | null;
  onSubmit: (data: { title: string; slug?: string; body?: string; excerpt?: string; type: ContentType; status: ContentStatus }) => Promise<void>;
  isSaving?: boolean;
}

export default function CmsEditor({ isOpen, onClose, content, onSubmit, isSaving = false }: CmsEditorProps) {
  const { t } = useLocale();
  const typeOptions = [
    { value: 'page', label: t('admin.type.page') },
    { value: 'article', label: t('admin.type.article') },
    { value: 'announcement', label: t('admin.type.announcement') },
  ];

  const statusOptions = [
    { value: 'draft', label: t('admin.contentStatus.draft') },
    { value: 'published', label: t('admin.contentStatus.published') },
    { value: 'archived', label: t('admin.contentStatus.archived') },
  ];
  const [form, setForm] = useState({ title: '', slug: '', body: '', excerpt: '', type: 'page' as ContentType, status: 'draft' as ContentStatus });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(() => [form.title, form.slug, form.body, form.excerpt].some((v) => v !== ''), [form]);
  const guard = useUnsavedGuard(isOpen && dirty && !isSaving);

  useEffect(() => {
    if (content) {
      setForm({ title: content.title || '', slug: content.slug || '', body: content.body || '', excerpt: content.excerpt || '', type: content.type || 'page', status: content.status || 'draft' });
    } else {
      setForm({ title: '', slug: '', body: '', excerpt: '', type: 'page', status: 'draft' });
    }
    setErrors({});
  }, [content, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const titleResult = validators.required(t('admin.form.title'))(form.title);
    if (!titleResult.valid) errs.title = titleResult.error!;
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug.trim())) errs.slug = t('admin.validation.slugChars');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit({
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      body: form.body.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      type: form.type,
      status: form.status,
    });
  };

  const handleClose = () => {
    if (dirty && !isSaving) guard.setShowDialog(true);
    else onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={content ? t('admin.form.editContent') : t('admin.form.addContent')} description="Slug otomatis dari judul bila dikosongkan." size="lg">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('admin.form.title')} placeholder="Judul konten" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} required leftIcon={<Heading3 className="h-4 w-4" />} />
          <Input label={t('admin.form.slug')} placeholder="judul-konten" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} leftIcon={<Link2 className="h-4 w-4" />} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label={t('admin.form.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })} options={typeOptions} required />
          <Select label={t('admin.form.status')} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })} options={statusOptions} required />
        </div>
        <Textarea label={t('admin.form.summary')} placeholder={t('admin.form.summaryOptional')} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
        <Textarea label={t('admin.form.content')} placeholder={t('admin.form.contentPh')} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" isLoading={isSaving}>{content ? t('admin.form.save') : t('admin.form.add')}</Button>
        </div>
      </form>
    </Modal>
  );
}
