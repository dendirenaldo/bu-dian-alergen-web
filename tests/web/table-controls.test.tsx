import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTableControls } from '@/hooks/useTableControls';

describe('useTableControls', () => {
  it('toggleSort bersiklus asc → desc → null dan mereset halaman', () => {
    const { result } = renderHook(() => useTableControls(10));
    expect(result.current.sort).toBeNull();

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ key: 'name', dir: 'asc' });
    expect(result.current.page).toBe(1);

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ key: 'name', dir: 'desc' });

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toBeNull();
  });

  it('kolom baru mulai dari asc; changeLimit mereset halaman', () => {
    const { result } = renderHook(() => useTableControls(10));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('email'));
    expect(result.current.sort).toEqual({ key: 'email', dir: 'asc' });

    act(() => {
      result.current.setPage(4);
      result.current.changeLimit(25);
    });
    expect(result.current.limit).toBe(25);
    expect(result.current.page).toBe(1);
  });

  it('sortParams membentuk query string yang benar', () => {
    const { result } = renderHook(() => useTableControls());
    expect(result.current.sortParams).toBe('');
    act(() => result.current.toggleSort('createdAt'));
    expect(result.current.sortParams).toBe('&sortBy=createdAt&sortDir=asc');
  });
});
