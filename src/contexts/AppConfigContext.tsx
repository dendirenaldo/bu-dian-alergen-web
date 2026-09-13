import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_BASE_URL, API_ENDPOINTS, APP_NAME } from '@/lib/constants';

interface AppConfig {
  appName: string;
}

const AppConfigContext = createContext<AppConfig>({ appName: APP_NAME });

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'AD';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [appName, setAppName] = useState<string>(APP_NAME);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SETTINGS.DETAIL('app_name')}`);
        if (!res.ok) return;
        const data = await res.json();
        const value = data?.data?.value ?? data?.value;
        if (!cancelled && typeof value === 'string' && value.trim()) {
          setAppName(value.trim());
        }
      } catch {
        /* offline/unauthorized -> fallback ke konstanta */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppConfigContext.Provider value={{ appName }}>{children}</AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export function useAppName() {
  return useContext(AppConfigContext).appName;
}

export function useAppInitials() {
  return initialsOf(useContext(AppConfigContext).appName);
}
