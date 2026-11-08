import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const handlers: Record<string, Array<(...args: any[]) => void>> = {};
const routerEvents = {
  on: vi.fn((event: string, cb: (...args: any[]) => void) => {
    (handlers[event] ??= []).push(cb);
  }),
  off: vi.fn((event: string, cb: (...args: any[]) => void) => {
    handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb);
  }),
  emit: vi.fn(),
};

vi.mock('next/router', () => ({
  useRouter: () => ({ events: routerEvents }),
}));

import PageLoadingBar from '@/components/shared/PageLoadingBar';

function emit(event: string) {
  for (const h of handlers[event] ?? []) h();
}

describe('PageLoadingBar', () => {
  it('bar dekoratif: aria-hidden setelah start, done saat complete', async () => {
    const { unmount } = render(<PageLoadingBar />);
    expect(document.getElementById('nprogress')).toBeNull();

    emit('routeChangeStart');
    await waitFor(() => expect(document.getElementById('nprogress')).toBeTruthy());
    expect(document.getElementById('nprogress')?.getAttribute('aria-hidden')).toBe('true');

    emit('routeChangeComplete');
    unmount();
  });

  it('mendaftarkan dan melepas ketiga event router', () => {
    const { unmount } = render(<PageLoadingBar />);
    expect(routerEvents.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(routerEvents.on).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(routerEvents.on).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
    unmount();
    expect(routerEvents.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(routerEvents.off).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(routerEvents.off).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
  });
});
