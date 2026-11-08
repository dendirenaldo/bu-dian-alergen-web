import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/constants', () => ({ API_BASE_URL: 'http://localhost', API_ENDPOINTS: {} }));

import { formatApiErrorMessage, isApiError, toFieldErrors } from '@/lib/api';
import { evaluatePassword } from '@/components/auth/PasswordStrength';

describe('toFieldErrors: backend {errors[], fields[]} -> record', () => {
  it('memetakan errors[] objek {field, message}', () => {
    const out = toFieldErrors({
      message: 'Validasi gagal',
      errors: [
        { field: 'email', message: 'email sudah terdaftar' },
        { field: 'password', message: 'Password minimal 8 karakter' },
      ],
    });
    expect(out).toEqual({
      email: 'email sudah terdaftar',
      password: 'Password minimal 8 karakter',
    });
  });

  it('mendukung errors[] string + fields[] string', () => {
    const out = toFieldErrors({
      message: 'Validasi gagal',
      errors: ['Token tidak valid'],
      fields: ['email'],
    });
    expect(out._form).toBe('Token tidak valid');
    expect(out.email).toBe('Validasi gagal');
  });

  it('mendukung constraints ala class-validator', () => {
    const out = toFieldErrors({
      message: 'Validasi gagal',
      errors: [{ property: 'email', constraints: { isEmail: 'email must be an email' } }],
    });
    expect(out.email).toBe('email must be an email');
  });

  it('payload kosong -> record kosong', () => {
    expect(toFieldErrors(null)).toEqual({});
    expect(toFieldErrors({})).toEqual({});
  });
});

describe('formatApiErrorMessage', () => {
  it('menggabungkan message + rincian field', () => {
    const msg = formatApiErrorMessage({
      status: 400,
      statusCode: 400,
      message: 'Validasi gagal',
      fieldErrors: { email: 'email sudah terdaftar' },
    });
    expect(isApiError({ status: 1, statusCode: 1, message: 'x', fieldErrors: {} })).toBe(true);
    expect(msg).toContain('email sudah terdaftar');
  });
});

describe('evaluatePassword (visual saja)', () => {
  it('skor 5 untuk password kuat', () => {
    expect(evaluatePassword('Kuat123!').score).toBe(5);
  });

  it('skor rendah untuk password lemah', () => {
    expect(evaluatePassword('abc').score).toBeLessThanOrEqual(1);
  });

  it('selalu menilai 5 kriteria', () => {
    expect(evaluatePassword('Abcdef12').criteria).toHaveLength(5);
  });
});
