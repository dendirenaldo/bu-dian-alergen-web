import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UsePaginationResult {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  offset: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const setPage = useCallback((p: number) => setPageState(Math.max(1, p)), []);
  const setLimit = useCallback((l: number) => {
    setLimitState(Math.max(1, l));
    setPageState(1);
  }, []);
  const nextPage = useCallback(() => setPageState((p) => p + 1), []);
  const prevPage = useCallback(() => setPageState((p) => Math.max(1, p - 1)), []);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    offset: (page - 1) * limit,
  };
}
