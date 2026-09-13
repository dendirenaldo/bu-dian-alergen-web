/** Unwrap envelope backend: { data } / { data, meta } / { data, total, ... } / raw. */
export interface UnwrappedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function unwrapListApi<T>(res: any, fallbackPage = 1, fallbackLimit = 10): UnwrappedList<T> {
  const body = res?.data ?? res;
  // Paginated: { data: [], total, page, limit, totalPages, meta? }
  if (body && Array.isArray(body.data)) {
    const meta = body.meta ?? {};
    const total = Number(body.total ?? meta.total ?? body.data.length ?? 0);
    const page = Number(body.page ?? meta.page ?? fallbackPage);
    const limit = Number(body.limit ?? meta.limit ?? fallbackLimit);
    const totalPages = Number(body.totalPages ?? meta.totalPages ?? (limit ? Math.ceil(total / limit) : 1));
    return { items: body.data as T[], total, page, limit, totalPages: totalPages || 1 };
  }
  // Array mentah
  if (Array.isArray(body)) {
    return { items: body as T[], total: body.length, page: 1, limit: body.length || fallbackLimit, totalPages: 1 };
  }
  // { data: {...} } tunggal
  if (body && typeof body === 'object' && 'data' in body && !Array.isArray((body as any).data)) {
    return { items: [], total: 0, page: fallbackPage, limit: fallbackLimit, totalPages: 1 };
  }
  return { items: [], total: 0, page: fallbackPage, limit: fallbackLimit, totalPages: 1 };
}

export function unwrapData<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res) return (res as any).data as T;
  return res as T;
}
