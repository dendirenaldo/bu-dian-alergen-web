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

interface CmsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content?: Content | null;
  onSubmit: (data: { title: string; slug?: string; body?: string; excerpt?: string; type: ContentType; status: ContentStatus }) => Promise<void>;
  isSaving?: boolean;
}

const typeOptions = [
  { value: 'page', label: 'Halaman' },
  { value: 'article', label: 'Artikel' },
  { value: 'announcement', label: 'Pengumuman' },
];

const statusOptions = [
  { value: 'draft', label: 'Draf' },
  { value: 'published', label: 'Terbit' },
  { value: 'archived', label: 'Arsip' },
];

export default function CmsEditor({ isOpen, onClose, content, onSubmit, isSaving = false }: CmsEditorProps) {
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
    const titleResult = validators.required('Judul')(form.title);
    if (!titleResult.valid) errs.title = titleResult.error!;
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug.trim())) errs.slug = 'Slug hanya huruf kecil, angka, strip';
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
    <Modal isOpen={isOpen} onClose={handleClose} title={content ? 'Ubah Konten' : 'Tambah Konten'} description="Slug otomatis dari judul bila dikosongkan." size="lg">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Judul" placeholder="Judul konten" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} required leftIcon={<Heading3 className="h-4 w-4" />} />
          <Input label="Slug (opsional)" placeholder="judul-konten" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} leftIcon={<Link2 className="h-4 w-4" />} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })} options={typeOptions} required />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })} options={statusOptions} required />
        </div>
        <Textarea label="Ringkasan" placeholder="Ringkasan singkat (opsional)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
        <Textarea label="Isi Konten" placeholder="Tulis konten di sini..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>Batal</Button>
          <Button type="submit" isLoading={isSaving}>{content ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
