import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import Modal from '@/components/ui/Modal';

/**
 * Meniru skenario nyata: modal FORM (induk) terbuka lebih dulu, lalu
 * dialog konfirmasi (anak) ter-mount BELAKANGAN ketika dibuka — persis
 * perilaku useUnsavedGuard. Mount bersamaan (dua isOpen sejak awal) tidak
 * pernah terjadi di aplikasi.
 */
function Harness({
  parentClose,
  childClose,
}: {
  parentClose: () => void;
  childClose: () => void;
}) {
  const [showChild, setShowChild] = useState(false);
  const closeChild = () => {
    setShowChild(false); // perilaku nyata: anak benar-benar tertutup
    childClose();
  };
  return (
    <div>
      <button onClick={() => setShowChild(true)}>buka-anak</button>
      <Modal isOpen onClose={parentClose} title="Induk">
        <p>form induk</p>
        {showChild && (
          <Modal isOpen onClose={closeChild} ariaLabel="Dialog konfirmasi">
            <p>dialog anak</p>
          </Modal>
        )}
      </Modal>
    </div>
  );
}

function renderNested() {
  const parentClose = vi.fn();
  const childClose = vi.fn();
  render(<Harness parentClose={parentClose} childClose={childClose} />);
  fireEvent.click(screen.getByText('buka-anak')); // anak mount belakangan
  return { parentClose, childClose };
}

describe('Modal bersarang (stack Escape + overflow)', () => {
  it('Escape hanya menutup modal TERATAS (anak), bukan induk', () => {
    const { parentClose, childClose } = renderNested();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(childClose).toHaveBeenCalledTimes(1);
    expect(parentClose).not.toHaveBeenCalled();
  });

  it('overflow body dipulihkan hanya setelah SEMUA modal tertutup', () => {
    const { unmount } = render(<Harness parentClose={vi.fn()} childClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('Escape kedua (setelah anak tertutup) mengenai induk', () => {
    const { parentClose, childClose } = renderNested();
    fireEvent.keyDown(document, { key: 'Escape' }); // anak
    expect(childClose).toHaveBeenCalledTimes(1);
    expect(parentClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' }); // induk (anak sudah tidak ada)
    expect(parentClose).toHaveBeenCalledTimes(1);
  });
});
