import { useCallback, useEffect, useRef, useState } from 'react';
import { api, newIdempotencyKey } from '@/lib/api';
import { unwrapListApi } from '@/lib/unwrap';
import { tr } from '@/lib/i18n';

interface Options {
  token: string | null;
  page: number;
  limit?: number;
  extraParams?: string;
  /** false = jangan kirim page/limit (endpoint tanpa paginasi server,
   *  mis. /contents); paginasi dilakukan client-side. Default true. */
  serverPagination?: boolean;
  /** Dipanggil bila page efektif berbeda dari page yang diminta
   *  (mis. item terakhir di halaman terakhir baru dihapus). Parent
   *  wajib men-sinkronkan currentPage agar label & fetch konsisten. */
  onPageClamp?: (effectivePage: number) => void;
}

/**
 * Fetch list anti-race:
 * - AbortController di-ref: request lama SELALU di-abort saat unmount /
 *   pergantian param (pola executor sinkron, bukan promise cleanup).
 * - requestId monotonik: hanya hasil terbaru yang menulis state.
 * - Auto-clamp: page > totalPages (setelah delete) memicu refetch halaman
 *   efektif + memberi tahu parent lewat onPageClamp.
 */
export function useAdminList<T>(
  endpoint: string,
  { token, page, limit = 10, extraParams = '', serverPagination = true, onPageClamp }: Options,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const clampedRef = useRef(false); // cegah loop clamp yang sama berulang

  const fetchPage = useCallback(
    async (pageParam: number) => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      abortRef.current?.abort();
      const requestId = ++requestIdRef.current;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsLoading(true);
      setError(null);
      try {
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = serverPagination
          ? `${endpoint}${sep}page=${pageParam}&limit=${limit}${extraParams}`
          : `${endpoint}${extraParams ? `${sep}${extraParams.replace(/^&/, '')}` : ''}`;
        const res = await api.get(url, token, ctrl.signal);
        if (requestIdRef.current !== requestId) return; // request basi
        const unwrapped = unwrapListApi<T>(res, pageParam, limit);
        let effective = pageParam;
        if (serverPagination) {
          effective = Math.max(1, Math.min(pageParam, unwrapped.totalPages || 1));
          setItems(unwrapped.items);
          setTotal(unwrapped.total);
          setTotalPages(unwrapped.totalPages || 1);
        } else {
          // Paginasi client-side: API mengembalikan semua item sekaligus.
          const all = unwrapped.items;
          const pages = Math.max(1, Math.ceil(all.length / limit));
          effective = Math.min(pageParam, pages);
          setItems(all.slice((effective - 1) * limit, effective * limit));
          setTotal(all.length);
          setTotalPages(pages);
        }
        // Page melebihi total (mis. hapus item terakhir) -> clamp:
        // beri tahu parent, lalu refetch sekali halaman efektif.
        if (effective !== pageParam && !clampedRef.current) {
          clampedRef.current = true;
          onPageClamp?.(effective);
          if (effective !== pageParam) {
            void fetchPage(effective);
            return;
          }
        }
        clampedRef.current = false;
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError') return;
        if (requestIdRef.current !== requestId) return;
        setError(e?.message || tr('api.err.loadFail'));
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, token, limit, extraParams, serverPagination, onPageClamp],
  );

  useEffect(() => {
    void fetchPage(page);
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchPage, page]);

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);
  const effectivePage = Math.min(page, totalPages);
  return { items, setItems, total, totalPages, effectivePage, isLoading, error, setError, refresh };
}

export { newIdempotencyKey };
