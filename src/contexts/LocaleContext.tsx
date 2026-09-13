import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import id from '@/messages/id.json';
import en from '@/messages/en.json';

type Locale = 'id' | 'en';
const dicts: Record<Locale, Record<string, string>> = { id, en };

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string } | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('id');
  const t = useCallback((key: string) => dicts[locale][key] ?? dicts.id[key] ?? key, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
