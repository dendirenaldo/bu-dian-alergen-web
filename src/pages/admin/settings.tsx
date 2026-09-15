import { ReactElement, useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageTransition from '@/components/shared/PageTransition';
import AdminRoute from '@/components/shared/AdminRoute';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
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
  const { t } = useLocale();
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
    } catch (err: any) { setError(err.message || t('api.err.loadFail')); }
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
      toast(t('toast.updated'));
      fetchList();
    } catch (err: any) { setError(err.message || t('toast.failed')); }
    finally { setSavingKey(null); }
  };

  return (
    <AdminRoute>
      <SeoHead title={t('admin.settings')} description={t('admin.pageDesc.settings')} path="/admin/settings" noIndex />
      <PageTransition>
        <div className="space-y-6">
          <div className="space-y-2">
            <Breadcrumb items={[{ label: t('admin.settings') }]} />
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('admin.settings')}</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('admin.pageDesc.settings')}</p>
          </div>
          {error && <Alert variant="error" title={t('api.err.loadFail')}>{error}</Alert>}
          {isLoading ? (
            <Card padding="md"><Skeleton width="100%" height="6rem" /></Card>
          ) : items.length === 0 ? (
            <Card padding="md"><p className="text-sm text-surface-500">{t('admin.emptyTitle.settings')}</p></Card>
          ) : (
            <div className="grid gap-4">
              {items.map((s) => (
                <Card key={s.key} padding="md">
                  <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4 text-surface-400" />
                    <h2 className="font-mono text-sm font-semibold">{s.key}</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <Input label={t('admin.settings.value')} value={editing[s.key]?.value ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], value: e.target.value } }))} required />
                    <Select label={t('admin.settings.type')} value={editing[s.key]?.type ?? 'string'} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], type: e.target.value } }))} options={[{ value: 'string', label: t('admin.settings.text') }, { value: 'number', label: t('admin.settings.number') }, { value: 'boolean', label: t('admin.settings.boolean') }, { value: 'json', label: t('admin.settings.json') }]} required />
                  </div>
                  <div className="mt-3">
                    <Input label={t('admin.settings.desc')} value={editing[s.key]?.description ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [s.key]: { ...p[s.key], description: e.target.value } }))} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" isLoading={savingKey === s.key} onClick={() => save(s.key)}><Save className="mr-1.5 h-4 w-4" />{t('common.save')}</Button>
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
