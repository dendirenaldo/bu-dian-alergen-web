import { useCallback, useState } from 'react';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

/**
 * State bersama tabel admin: halaman + ukuran halaman + sortir.
 * toggleSort: klik 1 → asc, klik 2 → desc, klik 3 → mati (kembali default server).
 * Setiap perubahan mereset ke halaman 1.
 */
export function useTableControls(defaultLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [sort, setSort] = useState<SortState | null>(null);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' as const };
      if (prev.dir === 'asc') return { key, dir: 'desc' as const };
      return null;
    });
    setPage(1);
  }, []);

  const changeLimit = useCallback((n: number) => {
    setLimit(n);
    setPage(1);
  }, []);

  const sortParams = sort ? `&sortBy=${encodeURIComponent(sort.key)}&sortDir=${sort.dir}` : '';

  return { page, setPage, limit, changeLimit, sort, toggleSort, sortParams };
}
