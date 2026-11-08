import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Dropdown from '@/components/ui/Dropdown';

function renderMenu(onSelect = vi.fn()) {
  return render(
    <Dropdown
      trigger={<span>pemicu</span>}
      onSelect={onSelect}
      items={[
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta', danger: true },
        { id: 'c', label: 'Charlie', disabled: true },
      ]}
    />
  );
}

describe('Dropdown (portal + animasi)', () => {
  it('menu tertutup secara default, terbuka saat trigger diklik', () => {
    renderMenu();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByText('pemicu'));
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('klik item memanggil onSelect lalu menu unmount setelah exit', async () => {
    const onSelect = vi.fn();
    renderMenu(onSelect);
    fireEvent.click(screen.getByText('pemicu'));
    fireEvent.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith('b');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull(), { timeout: 1500 });
  });

  it('Escape menutup menu tanpa memanggil onSelect', async () => {
    const onSelect = vi.fn();
    renderMenu(onSelect);
    fireEvent.click(screen.getByText('pemicu'));
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull(), { timeout: 1500 });
  });

  it('navigasi keyboard ArrowDown/ArrowUp memindahkan fokus antar item', () => {
    renderMenu();
    fireEvent.click(screen.getByText('pemicu'));
    const menu = screen.getByRole('menu');
    // Fokus awal belum di menu (rAF) → ArrowDown pertama ke item pertama.
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Alpha');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Beta');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // Charlie disabled → lompat kembali ke Alpha.
    expect(document.activeElement?.textContent).toBe('Alpha');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Beta');
  });
});
