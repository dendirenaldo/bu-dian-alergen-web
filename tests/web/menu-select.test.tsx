import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@/contexts/LocaleContext';

function withLocale(children: React.ReactNode) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

import MenuSelect from '@/components/ui/MenuSelect';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Charlie', disabled: true },
];

function Harness({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <MenuSelect
      label="Pilih"
      options={OPTIONS}
      value={value}
      onChange={(e: any) => {
        setValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder="Pilih…"
    />
  );
}

describe('MenuSelect', () => {
  it('menampilkan placeholder saat kosong, membuka popup saat diklik', () => {
    render(withLocale(<Harness onChange={vi.fn()} />));
    expect(screen.getByText('Pilih…')).toBeTruthy();
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('memilih opsi memanggil onChange dan menutup popup', async () => {
    const onChange = vi.fn();
    render(withLocale(<Harness onChange={onChange} />));
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull(), { timeout: 1500 });
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('opsi disabled tidak bisa dipilih', () => {
    const onChange = vi.fn();
    render(withLocale(<Harness onChange={onChange} />));
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Charlie'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('searchable memfilter opsi', () => {
    render(
      withLocale(
        <MenuSelect label="Cari" options={OPTIONS} value="" onChange={() => {}} searchable />,
      ),
    );
    fireEvent.click(screen.getByRole('combobox'));
    const input = screen.getByPlaceholderText('Cari...');
    fireEvent.change(input, { target: { value: 'alp' } });
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();
  });
});
