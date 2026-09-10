'use client';

import { useState, useEffect } from 'react';
import { Content, ContentType, ContentStatus } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface CmsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content?: Content | null;
  onSubmit: (data: {
    title: string;
    body?: string;
    excerpt?: string;
    type: ContentType;
    status: ContentStatus;
  }) => Promise<void>;
}

const typeOptions = [
  { value: 'page', label: 'Page' },
  { value: 'article', label: 'Article' },
  { value: 'announcement', label: 'Announcement' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function CmsEditor({ isOpen, onClose, content, onSubmit }: CmsEditorProps) {
  const [form, setForm] = useState({
    title: '',
    body: '',
    excerpt: '',
    type: 'page' as ContentType,
    status: 'draft' as ContentStatus,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (content) {
      setForm({
        title: content.title || '',
        body: content.body || '',
        excerpt: content.excerpt || '',
        type: content.type || 'page',
        status: content.status || 'draft',
      });
    } else {
      setForm({ title: '', body: '', excerpt: '', type: 'page', status: 'draft' });
    }
  }, [content, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const titleResult = validators.required('Judul')(form.title);
    if (!titleResult.valid) errs.title = titleResult.error!;
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
        title: form.title,
        body: form.body || undefined,
        excerpt: form.excerpt || undefined,
        type: form.type,
        status: form.status,
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
      title={content ? 'Edit Konten' : 'Tambah Konten'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Judul"
          placeholder="Masukkan judul"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipe"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}
            options={typeOptions}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}
            options={statusOptions}
          />
        </div>
        <Textarea
          label="Excerpt"
          placeholder="Ringkasan singkat"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          rows={2}
        />
        <Textarea
          label="Konten"
          placeholder="Tulis konten di sini..."
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={10}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {content ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
