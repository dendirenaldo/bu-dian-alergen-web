import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
  newIdempotencyKey: () => 'test-key',
}));

import { api as mockApi } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';

type Resolver = { resolve: (v: unknown) => void; url?: string };
let pending: Resolver[] = [];

/** Bentuk respons backend: TransformInterceptor membungkus `{ data: {...} }`. */
function envelope(items: unknown[], page: number, limit: number, total: number, totalPages: number) {
  return { data: { data: items, total, page, limit, totalPages } };
}

beforeEach(() => {
  pending = [];
  (mockApi.get as ReturnType<typeof vi.fn>).mockClear();
  (mockApi.get as ReturnType<typeof vi.fn>).mockImplementation(
    (url: string, _token?: string, signal?: AbortSignal) =>
      new Promise((resolve, reject) => {
        const entry: Resolver & { reject: (e: unknown) => void; url: string } = {
          resolve: resolve as (v: unknown) => void,
          reject: reject as (e: unknown) => void,
          url,
        };
        pending.push(entry);
        signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        );
      }),
  );
});

function renderHookPage(page: number, onPageClamp?: (p: number) => void) {
  return renderHook(
    ({ p }: { p: number }) =>
      useAdminList<{ id: number }>('/api/v1/items', {
        token: 'tok',
        page: p,
        limit: 10,
        onPageClamp,
      }),
    { initialProps: { p: page } },
  );
}

describe('useAdminList anti-race + auto-clamp', () => {
  it('request basi TIDAK menulis state setelah ganti halaman', async () => {
    const h = renderHookPage(1);
    await waitFor(() => expect(pending).toHaveLength(1));

    h.rerender({ p: 2 });
    await waitFor(() => expect(pending).toHaveLength(2));

    // Resolve hal-2 (baru) lebih dulu.
    await act(async () => {
      pending[1].resolve(envelope([{ id: 22 }], 2, 10, 40, 4));
    });
    await waitFor(() => expect(h.result.current.items).toEqual([{ id: 22 }]));

    // Lalu resolve hal-1 (stale, sudah di-abort sinyalnya) -> abaikan.
    await act(async () => {
      pending[0].resolve(envelope([{ id: 11 }], 1, 10, 40, 4));
    });
    expect(h.result.current.items).toEqual([{ id: 22 }]);
    expect(h.result.current.error).toBeNull();
  });

  it('page > totalPages -> onPageClamp dipanggil + refetch halaman efektif', async () => {
    const clamped: number[] = [];
    renderHookPage(3, (p) => clamped.push(p));

    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => {
      pending[0].resolve(envelope([], 3, 10, 15, 2));
    });

    await waitFor(() => expect(clamped).toEqual([2]));
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(pending[1].url).toContain('page=2');
    await act(async () => {
      pending[1].resolve(envelope([{ id: 21 }], 2, 10, 15, 2));
    });
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(2));
  });

  it('serverPagination=false: tanpa page/limit di URL (paginasi client-side)', async () => {
    renderHook(
      () =>
        useAdminList<{ id: number }>('/api/v1/items', {
          token: 'tok',
          page: 3,
          limit: 10,
          serverPagination: false,
        }),
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    expect(pending[0].url).not.toContain('page=');
    expect(pending[0].url).not.toContain('limit=');
  });
});
