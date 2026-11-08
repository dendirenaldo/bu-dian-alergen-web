import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@/contexts/LocaleContext';

function withLocale(children: React.ReactNode) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

import { CalendarPicker } from '@/components/ui/CalendarPicker';

function Harness({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <CalendarPicker
      label="Tanggal"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('CalendarPicker', () => {
  it('membuka kalender saat tombol diklik', () => {
    render(withLocale(<Harness onChange={vi.fn()} />));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /tanggal/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('input manual YYYY-MM-DD valid memanggil onChange', () => {
    const onChange = vi.fn();
    render(withLocale(<Harness onChange={onChange} />));
    fireEvent.click(screen.getByRole('button', { name: /tanggal/i }));
    fireEvent.change(screen.getByPlaceholderText('YYYY-MM-DD'), { target: { value: '2026-02-15' } });
    fireEvent.click(screen.getByText('OK'));
    expect(onChange).toHaveBeenCalledWith('2026-02-15');
  });

  it('input manual invalid menampilkan role=alert dan tidak memanggil onChange', () => {
    const onChange = vi.fn();
    render(withLocale(<Harness onChange={onChange} />));
    fireEvent.click(screen.getByRole('button', { name: /tanggal/i }));
    fireEvent.change(screen.getByPlaceholderText('YYYY-MM-DD'), { target: { value: 'bukan-tanggal' } });
    fireEvent.click(screen.getByText('OK'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('minDate menonaktifkan tanggal di luar batas', async () => {
    const onChange = vi.fn();
    render(
      withLocale(
        <CalendarPicker label="Tanggal" value="2026-02-15" onChange={onChange} minDate="2026-02-10" maxDate="2026-02-20" />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /tanggal/i }));
    const disabled = screen.getByLabelText('2026-02-05') as HTMLButtonElement;
    expect(disabled.disabled).toBe(true);
    fireEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeTruthy());
  });
});
