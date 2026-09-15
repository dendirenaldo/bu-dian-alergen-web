export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function activeDateLocale(): string {
  if (typeof window === 'undefined') return 'id-ID';
  try {
    return window.localStorage.getItem('locale') === 'en' ? 'en-US' : 'id-ID';
  } catch {
    return 'id-ID';
  }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(activeDateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString(activeDateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
