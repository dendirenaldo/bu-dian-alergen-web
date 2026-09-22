import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn(() => Promise.resolve(true));
const routerEvents = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };

vi.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/', push, events: routerEvents }),
}));

import { LocaleProvider } from '@/contexts/LocaleContext';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';

function Harness({ onExtra }: { onExtra: () => void }) {
  const guard = useUnsavedGuard(true);
  return (
    <div>
      <button onClick={() => guard.setShowDialog(true)}>buka-guard</button>
      <guard.Dialog onClose={onExtra} />
    </div>
  );
}

function openDialog() {
  fireEvent.click(screen.getByText('buka-guard'));
}

describe('useUnsavedGuard', () => {
  it('klik "Ya" ganda: extraOnClose dipanggil TEPAT sekali', () => {
    const onExtra = vi.fn();
    render(
      <LocaleProvider>
        <Harness onExtra={onExtra} />
      </LocaleProvider>,
    );
    openDialog();

    const confirmBtn = screen.getByText('Ya, lanjutkan');
    fireEvent.click(confirmBtn);
    expect(onExtra).toHaveBeenCalledTimes(1);
    // Klik kedua: tombol sudah disabled (isLoading) -> tanpa efek.
    fireEvent.click(confirmBtn);
    expect(onExtra).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it('"Tetap di sini": extraOnClose TIDAK dipanggil (modal induk tetap terbuka)', () => {
    const onExtra = vi.fn();
    render(
      <LocaleProvider>
        <Harness onExtra={onExtra} />
      </LocaleProvider>,
    );
    openDialog();
    fireEvent.click(screen.getByText('Tetap di sini'));
    expect(onExtra).not.toHaveBeenCalled();
    // Dialog tertutup — tombol konfirmasi hilang.
    expect(screen.queryByText('Ya, lanjutkan')).toBeNull();
  });
});
