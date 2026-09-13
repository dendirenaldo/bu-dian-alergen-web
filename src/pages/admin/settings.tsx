import { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { unwrapData, unwrapListApi } from '@/lib/unwrap';

interface Setting { key: string; value: string; type: string; description?: string }

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, { value: string; type: string; description: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchList = async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await api.get(API_ENDPOINTS.SETTINGS.LIST, token);
      const u = unwrapListApi<Setting>(res);
      const list = u.items.length ? u.items : (Array.isArray(unwrapData<any>(res)) ? unwrapData<any>(res) : []);
      setItems(list);
      const map: any = {};
      list.forEach((s: Setting) => { map[s.key] = { value: s.value ?? '', type: s.type ?? 'string', description: s.description ?? '' }; });
      setEditing(map);
    } catch (err: any) { setError(err.message || 'Gagal memuat pengaturan'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchList(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async (key: string) => {
    const draft = editing[key];
    if (!draft) return;
    setSavingKey(key);
    try {
      await api.put(API_ENDPOINTS.SETTINGS.DETAIL(key), { value: draft.value, type: draft.type, description: draft.description || undefined }, token!, { idempotencyKey: newIdempotencyKey() });
      toast(`Pengaturan "${key}" disimpan`);
      fetchList();
    } catch (err: any) { setError(err.message || 'Gagal menyimpan pengaturan'); }
    finally { setSavingKey(null); }
  };

  return (
    <AdminRoute>
      <Head><title>Pengaturan - Admin Bu Dian</title></Head>
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: 'Pengaturan' }]} />
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pengaturan</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Ubah konfigurasi aplikasi. Perubahan langsung berlaku.</p>
          </div>
          {error && <Alert variant="error" title="Gagal">{error}</Alert>}
          {isLoading ? (
            <Card padding="md"><Skeleton width="100%" height="6rem" /></Card>
          ) : items.length === 0 ? (
            <Card padding="md"><p className="text-sm text-surface-500">Belum ada pengaturan.</p></Card>
          ) : (
            <div className="grid gap-4">
              {items.map((s) => (
                <Card key={s.key} padding="md">
                  <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4 text-surface-400" />
                    <h2 className="font-mono text-sm font-semibold">{s.key}</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <Input label="Nilai" value={editing[s.key]?.value ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], value: e.target.value } }))} required />
                    <Select label="Tipe" value={editing[s.key]?.type ?? 'string'} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], type: e.target.value } }))} options={[{ value: 'string', label: 'Teks' }, { value: 'number', label: 'Angka' }, { value: 'boolean', label: 'Boolean' }, { value: 'json', label: 'JSON' }]} required />
                  </div>
                  <div className="mt-3">
                    <Input label="Deskripsi (opsional)" value={editing[s.key]?.description ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], description: e.target.value } }))} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" isLoading={savingKey === s.key} onClick={() => save(s.key)}><Save className="mr-1.5 h-4 w-4" />Simpan</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </AdminRoute>
  );
}

AdminSettingsPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
