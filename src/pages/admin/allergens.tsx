import { ReactElement, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import AdminTable from '@/components/admin/AdminTable';
import AllergenForm from '@/components/admin/AllergenForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Allergen } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminList } from '@/hooks/useAdminList';

const severityVariant = (s: string): 'danger' | 'warning' | 'info' | 'default' => {
  if (s === 'critical') return 'danger';
  if (s === 'high') return 'warning';
  if (s === 'medium') return 'info';
  return 'default';
};
const severityLabel = (s: string) => ({ low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' } as any)[s] ?? s;

export default function AdminAllergensPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Allergen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items: allergens, total, totalPages, isLoading, error, setError, refresh } =
    useAdminList<Allergen>(API_ENDPOINTS.ALLERGENS.LIST, { token, page: currentPage, limit: 10 });

  const handleCreate = async (data: any) => {
    setError(null); setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.ALLERGENS.LIST, data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Alergen berhasil dibuat'); setIsFormOpen(false); refresh();
    } catch (err: any) { setError(err.message || 'Gagal membuat alergen'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleUpdate = async (data: any) => {
    if (!selectedAllergen) return;
    setError(null); setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.ALLERGENS.DETAIL(selectedAllergen.id), data, token!, { idempotencyKey: newIdempotencyKey() });
      toast('Perubahan alergen disimpan'); setIsFormOpen(false); setSelectedAllergen(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal mengupdate alergen'); throw err; }
    finally { setIsSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.ALLERGENS.DETAIL(deleteTarget.id), token!);
      toast('Alergen berhasil dihapus'); setDeleteTarget(null); refresh();
    } catch (err: any) { setError(err.message || 'Gagal menghapus alergen'); }
    finally { setIsDeleting(false); }
  };

  const columns = [
    { key: 'name', label: 'Nama', render: (item: Allergen) => <span className="font-medium">{item.name}</span> },
    { key: 'code', label: 'Kode', render: (a: Allergen) => <span className="font-mono text-xs">{a.code}</span> },
    { key: 'severityLevel', label: 'Keparahan', render: (item: Allergen) => <Badge variant={severityVariant(item.severityLevel)}>{severityLabel(item.severityLevel)}</Badge> },
    { key: 'color', label: 'Warna', render: (a: Allergen) => a.color ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: a.color }} /><span className="font-mono text-xs">{a.color}</span></span> : '—' },
    { key: 'isActive', label: 'Status', render: (item: Allergen) => <Badge variant={item.isActive === false ? 'default' : 'success'}>{item.isActive === false ? 'Nonaktif' : 'Aktif'}</Badge> },
  ];

  return (
    <AdminRoute>
      <Head><title>Alergen - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Alergen' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Alergen</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Kode memakai huruf kapital. Warna format hex (#RRGGBB).</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          <AdminTable data={allergens} columns={columns} isLoading={isLoading} total={total} totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            onAdd={() => { setSelectedAllergen(null); setIsFormOpen(true); }}
            onEdit={(a) => { setSelectedAllergen(a); setIsFormOpen(true); }}
            onDelete={setDeleteTarget} emptyTitle="Belum ada alergen" emptyDescription="Tambahkan master alergen." addLabel="Tambah Alergen" />
          <AllergenForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedAllergen(null); }} allergen={selectedAllergen} onSubmit={selectedAllergen ? handleUpdate : handleCreate} isSaving={isSaving} />
          <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus alergen?" description={deleteTarget ? `Hapus alergen "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.` : undefined} confirmLabel="Ya, hapus" cancelLabel="Batal" isLoading={isDeleting} />
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminAllergensPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
