'use client';

import { useState, useEffect } from 'react';
import { Allergen, AllergenSeverity } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface AllergenFormProps {
  isOpen: boolean;
  onClose: () => void;
  allergen?: Allergen | null;
  onSubmit: (data: {
    name: string;
    code: string;
    description?: string;
    severityLevel: AllergenSeverity;
    color?: string;
  }) => Promise<void>;
}

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function AllergenForm({ isOpen, onClose, allergen, onSubmit }: AllergenFormProps) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    severityLevel: 'low' as AllergenSeverity,
    color: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (allergen) {
      setForm({
        name: allergen.name || '',
        code: allergen.code || '',
        description: allergen.description || '',
        severityLevel: allergen.severityLevel || 'low',
        color: allergen.color || '',
      });
    } else {
      setForm({ name: '', code: '', description: '', severityLevel: 'low', color: '' });
    }
  }, [allergen, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required('Nama Alergen')(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    const codeResult = validators.required('Kode')(form.code);
    if (!codeResult.valid) errs.code = codeResult.error!;
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
        code: form.code,
        description: form.description || undefined,
        severityLevel: form.severityLevel,
        color: form.color || undefined,
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
      title={allergen ? 'Edit Alergen' : 'Tambah Alergen'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Alergen"
          placeholder="Masukkan nama alergen"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <Input
          label="Kode"
          placeholder="Masukkan kode (contoh: GLU)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          error={errors.code}
          required
        />
        <Select
          label="Tingkat Keparahan"
          value={form.severityLevel}
          onChange={(e) => setForm({ ...form, severityLevel: e.target.value as AllergenSeverity })}
          options={severityOptions}
        />
        <Input
          label="Warna (Hex)"
          placeholder="#FF0000"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
        <Textarea
          label="Deskripsi"
          placeholder="Masukkan deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {allergen ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
