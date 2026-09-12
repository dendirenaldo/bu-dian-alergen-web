'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { validators } from '@/lib/validation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSubmit: (data: { name: string; brand?: string; description?: string; barcode?: string }) => Promise<void>;
}

export default function ProductForm({ isOpen, onClose, product, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    description: '',
    barcode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBlur = (field: string, value: string) => {
    let result;
    if (field === 'name') result = validators.required('Nama Produk')(value);
    if (field === 'barcode' && value && !/^[0-9]+$/.test(value)) {
      result = { valid: false, error: 'Barcode harus berupa angka' };
    }
    if (result && !result.valid) {
      setErrors(prev => ({ ...prev, [field]: result!.error! }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        brand: product.brand || '',
        description: product.description || '',
        barcode: product.barcode || '',
      });
    } else {
      setForm({ name: '', brand: '', description: '', barcode: '' });
    }
  }, [product, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required('Nama Produk')(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    if (form.barcode && !/^[0-9]+$/.test(form.barcode)) errs.barcode = 'Barcode harus berupa angka';
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
        brand: form.brand || undefined,
        description: form.description || undefined,
        barcode: form.barcode || undefined,
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
      title={product ? 'Edit Produk' : 'Tambah Produk'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Produk"
          placeholder="Masukkan nama produk"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={(e) => handleBlur('name', e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Merek"
          placeholder="Masukkan merek"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
        />
        <Input
          label="Barcode"
          placeholder="Masukkan barcode"
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          onBlur={(e) => handleBlur('barcode', e.target.value)}
          error={errors.barcode}
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
            {product ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
