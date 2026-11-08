import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import Modal from '@/components/ui/Modal';

function ToggleHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)}>saklar</button>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        title="Transisi"
      >
        <p>isi modal</p>
      </Modal>
    </div>
  );
}

describe('Modal open/close beranimasi', () => {
  it('panel ter-render dengan role dialog saat dibuka', () => {
    render(<ToggleHarness onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('isi modal')).toBeTruthy();
  });

  it('close menunda unmount hingga animasi exit selesai (tidak instan)', async () => {
    const onClose = vi.fn();
    render(<ToggleHarness onClose={onClose} />);
    fireEvent.click(screen.getByText('saklar')); // tutup via state induk (tanpa onClose)
    // Tepat setelah close: dialog masih di DOM karena animasi exit berjalan.
    expect(screen.queryByRole('dialog')).toBeTruthy();
    // Setelah animasi (~200ms) selesai: dialog unmount.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 1500 });
  });

  it('klik overlay memanggil onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        <p>x</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.previousElementSibling as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
