import id from '@/messages/id.json';
import en from '@/messages/en.json';
import { translate } from '@/contexts/LocaleContext';

type Locale = 'id' | 'en';

/** Locale aktif tanpa hook (untuk modul non-komponen: api, validation). */
export function getActiveLocale(): Locale {
  if (typeof window === 'undefined') return 'id';
  try {
    const saved = window.localStorage.getItem('locale');
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    /* abaikan */
  }
  return 'id';
}

/** Terjemahan + interpolasi {param} tanpa hook. */
export function tr(key: string, params?: Record<string, string | number>): string {
  return translate(getActiveLocale(), key, params);
}

export const dicts = { id, en };
