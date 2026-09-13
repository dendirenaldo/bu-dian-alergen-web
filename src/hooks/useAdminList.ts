import { useCallback, useEffect, useRef, useState } from 'react';
import { api, newIdempotencyKey } from '@/lib/api';
import { unwrapListApi } from '@/lib/unwrap';
import { tr } from '@/lib/i18n';

interface Options {
  token: string | null;
  page: number;
  limit?: number;
  extraParams?: string;
  /** false = jangan kirim page/limit (endpoint tanpa paginasi, mis. /contents);
   *  paginasi dilakukan client-side. Default true. */
  serverPagination?: boolean;
}

/** Fetch list dengan AbortController (anti race), unwrap envelope, dan total. */
export function useAdminList<T>(endpoint: string, { token, page, limit = 10, extraParams = '', serverPagination = true }: Options) {
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
      const url = serverPagination
        ? `${endpoint}${sep}page=${page}&limit=${limit}${extraParams}`
        : `${endpoint}${extraParams ? `${sep}${extraParams.replace(/^&/, '')}` : ''}`;
      const res = await api.get(url, token, ctrl.signal);
      const unwrapped = unwrapListApi<T>(res, page, limit);
      if (serverPagination) {
        setItems(unwrapped.items);
        setTotal(unwrapped.total);
        setTotalPages(unwrapped.totalPages);
      } else {
        // Paginasi client-side: API mengembalikan semua item sekaligus.
        const all = unwrapped.items;
        const totalPagesCalc = Math.max(1, Math.ceil(all.length / limit));
        const safePage = Math.min(page, totalPagesCalc);
        setItems(all.slice((safePage - 1) * limit, safePage * limit));
        setTotal(all.length);
        setTotalPages(totalPagesCalc);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || tr('api.err.loadFail'));
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
