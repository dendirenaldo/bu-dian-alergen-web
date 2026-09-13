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

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'id';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' || saved === 'id' ? saved : 'id';
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: TFunction } | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable (private mode) — memory only */
    }
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
