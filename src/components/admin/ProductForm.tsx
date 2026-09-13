'use client';

import { useState, useEffect, useMemo } from 'react';
import { Package, Tag, Barcode, FolderOpen, FileText, Link2 } from 'lucide-react';
import { Product, Category } from '@/types';
import { validators } from '@/lib/validation';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { unwrapListApi } from '@/lib/unwrap';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSubmit: (data: { name: string; slug?: string; brand?: string; description?: string; barcode?: string; categoryId?: number }) => Promise<void>;
  isSaving?: boolean;
}

export default function ProductForm({ isOpen, onClose, product, onSubmit, isSaving = false }: ProductFormProps) {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: '', slug: '', brand: '', description: '', barcode: '', categoryId: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () => [form.name, form.slug, form.brand, form.description, form.barcode, form.categoryId].some((v) => v !== ''),
    [form],
  );
  const guard = useUnsavedGuard(isOpen && dirty && !isSaving);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setForm({
        name: product.name || '',
        slug: (product as any).slug || '',
        brand: product.brand || '',
        description: product.description || '',
        barcode: product.barcode || '',
        categoryId: (product as any).categoryId ? String((product as any).categoryId) : product.category ? String(product.category.id) : '',
      });
    } else {
      setForm({ name: '', slug: '', brand: '', description: '', barcode: '', categoryId: '' });
    }
    setErrors({});
  }, [product, isOpen]);

  useEffect(() => {
    if (!isOpen || !token) return;
    let cancelled = false;
    api.get(API_ENDPOINTS.CATEGORIES.LIST, token).then((res) => {
      if (cancelled) return;
      setCategories(unwrapListApi<Category>(res).items.length ? unwrapListApi<Category>(res).items : (Array.isArray((res as any).data) ? (res as any).data : []));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, token]);

  const handleBlur = (field: string, value: string) => {
    let result;
    if (field === 'name') result = validators.required('Nama Produk')(value);
    if (field === 'barcode' && value && !/^[0-9]+$/.test(value)) {
      result = { valid: false, error: 'Barcode harus berupa angka' };
    }
    if (field === 'slug' && value && !/^[a-z0-9-]+$/.test(value)) {
      result = { valid: false, error: 'Slug hanya huruf kecil, angka, strip' };
    }
    if (result && !result.valid) setErrors((prev) => ({ ...prev, [field]: result!.error! }));
    else setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required('Nama Produk')(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    if (form.barcode && !/^[0-9]+$/.test(form.barcode)) errs.barcode = 'Barcode harus berupa angka';
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug hanya huruf kecil, angka, strip';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      brand: form.brand.trim() || undefined,
      description: form.description.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
    });
  };

  const handleClose = () => {
    if (dirty && !isSaving) guard.setShowDialog(true);
    else onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'Ubah Produk' : 'Tambah Produk'} description="Slug otomatis dari nama bila dikosongkan." size="md">
      <guard.Dialog onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nama Produk" placeholder="cth: Indomie Goreng" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={(e) => handleBlur('name', e.target.value)} error={errors.name} required leftIcon={<Package className="h-4 w-4" />} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Slug (opsional)" placeholder="indomie-goreng" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} onBlur={(e) => handleBlur('slug', e.target.value)} error={errors.slug} leftIcon={<Link2 className="h-4 w-4" />} helperText="Kosongkan untuk otomatis." />
          <Select label="Kategori" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} options={[{ value: '', label: 'Tanpa kategori' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Merek" placeholder="cth: Indofood" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} leftIcon={<Tag className="h-4 w-4" />} />
          <Input label="Barcode" placeholder="Hanya angka" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} onBlur={(e) => handleBlur('barcode', e.target.value)} error={errors.barcode} leftIcon={<Barcode className="h-4 w-4" />} inputMode="numeric" />
        </div>
        <Textarea label="Deskripsi" placeholder="Deskripsi singkat produk" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>Batal</Button>
          <Button type="submit" isLoading={isSaving}>{product ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
