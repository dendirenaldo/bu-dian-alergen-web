import { useCallback, useEffect, useRef, useState } from 'react';
import { api, newIdempotencyKey } from '@/lib/api';
import { unwrapListApi } from '@/lib/unwrap';

interface Options {
  token: string | null;
  page: number;
  limit?: number;
  extraParams?: string;
}

/** Fetch list dengan AbortController (anti race), unwrap envelope, dan total. */
export function useAdminList<T>(endpoint: string, { token, page, limit = 10, extraParams = '' }: Options) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setIsLoading(true);
    setError(null);
    try {
      const sep = endpoint.includes('?') ? '&' : '?';
      const res = await api.get(`${endpoint}${sep}page=${page}&limit=${limit}${extraParams}`, token, ctrl.signal);
      const unwrapped = unwrapListApi<T>(res, page, limit);
      setItems(unwrapped.items);
      setTotal(unwrapped.total);
      setTotalPages(unwrapped.totalPages);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, token, page, limit, extraParams]);

  useEffect(() => {
    const cleanup = fetchList() as unknown as (() => void) | undefined;
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [fetchList]);

  return { items, setItems, total, totalPages, isLoading, error, setError, refresh: fetchList };
}

export { newIdempotencyKey };
