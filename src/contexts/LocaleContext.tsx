import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import id from '@/messages/id.json';
import en from '@/messages/en.json';

type Locale = 'id' | 'en';
const dicts: Record<Locale, Record<string, string>> = { id, en };
const STORAGE_KEY = 'locale';

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let text: string = dicts[locale][key] ?? dicts.id[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

function readSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
    const cookie = document.cookie.match(/(?:^|;\s*)locale=(id|en)(?:;|$)/);
    if (cookie) return cookie[1] as Locale;
  } catch {
    /* storage unavailable — memory only */
  }
  return null;
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: TFunction } | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Render PERTAMA selalu 'id' di server DAN client (hydration identik —
  // tanpa React mismatch). Locale tersimpan dipulihkan SETELAH mount.
  const [locale, setLocaleState] = useState<Locale>('id');
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      // Cookie juga diset agar konsisten dengan inisiasi _document dan
      // siap dipakai SSR di masa depan.
      document.cookie = `${STORAGE_KEY}=${l}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      /* storage unavailable (private mode) — memory only */
    }
  }, []);
  useEffect(() => {
    // Restore setelah hydration: server & client render pertama identik ('id'),
    // baru di efek ini state diselaraskan dengan pilihan pengguna.
    const saved = readSavedLocale();
    if (saved && saved !== 'id') setLocaleState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const t = useCallback<TFunction>(
    (key, params) => translate(locale, key, params),
    [locale]
  );
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
