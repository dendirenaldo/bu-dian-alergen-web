import { tr, getActiveLocale } from './i18n';

function activeIntlLocale(): string {
  try {
    return getActiveLocale() === 'en' ? 'en-US' : 'id-ID';
  } catch {
    return 'id-ID';
  }
}

function pick(keyPrimary: string, keyFallback: string, hardcoded: string): string {
  const v = tr(keyPrimary);
  if (v !== keyPrimary) return v;
  const f = tr(keyFallback);
  if (f !== keyFallback) return f;
  return hardcoded;
}

/**
 * BERT → "BERT", bilstm → "BiLSTM", ensemble → "Ensemble".
 * Fallback: ganti _/- jadi spasi lalu UPPERCASE.
 */
export function formatModelName(model?: string | null): string {
  if (model == null) return '—';
  const raw = String(model).trim();
  if (!raw) return '—';
  const key = raw.toLowerCase();
  if (key === 'bert') {
    const v = tr('model.bert');
    return v === 'model.bert' ? 'BERT' : v;
  }
  if (key === 'bilstm' || key === 'bi-lstm' || key === 'bi_lstm') {
    const v = tr('model.bilstm');
    return v === 'model.bilstm' ? 'BiLSTM' : v;
  }
  if (key === 'ensemble') {
    const v = tr('model.ensemble');
    return v === 'model.ensemble' ? 'Ensemble' : v;
  }
  return raw.replace(/[_-]+/g, ' ').toUpperCase();
}

/**
 * image_ocr → t('admin.method.image'), text_input/text → t('admin.method.text').
 */
export function formatMethod(method?: string | null): string {
  if (method == null) return '—';
  const raw = String(method).trim();
  if (!raw) return '—';
  const n = raw.toLowerCase();
  if (n === 'image_ocr' || n === 'image' || n === 'ocr') return tr('admin.method.image');
  if (n === 'text_input' || n === 'text' || n === 'textinput' || n === 'text-input') return tr('admin.method.text');
  return raw.replace(/_/g, ' ');
}

/** safe → Aman/Safe, unsafe → Berbahaya/Unsafe (bilingual via tr). */
export function formatResult(result?: string | null): string {
  if (result == null) return '—';
  const raw = String(result).trim();
  if (!raw) return '—';
  const n = raw.toLowerCase();
  if (n === 'safe') return pick('result.safe', 'admin.safe', 'Aman');
  if (n === 'unsafe' || n === 'danger' || n === 'positive') return pick('result.unsafe', 'admin.unsafe', 'Berbahaya');
  return raw;
}

/** low/medium/high/critical → label bilingual. */
export function formatSeverity(severity?: string | null): string {
  if (severity == null) return '—';
  const raw = String(severity).trim();
  if (!raw) return '—';
  const n = raw.toLowerCase();
  if (n === 'low') return pick('severity.low', 'admin.severity.low', 'Rendah');
  if (n === 'medium') return pick('severity.medium', 'admin.severity.medium', 'Sedang');
  if (n === 'high') return pick('severity.high', 'admin.severity.high', 'Tinggi');
  if (n === 'critical') return pick('severity.critical', 'admin.severity.critical', 'Kritis');
  return raw;
}

/** Intl.DateTimeFormat id-ID (atau en-US saat locale en). Invalid → '—'. */
export function formatDateTime(value?: string | Date | number | null): string {
  if (value == null || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/** 0-1 → "87,5%" (id) / "87.5%" (en). Null/NaN → '—'. */
export function formatConfidence(score?: number | null): string {
  if (score == null) return '—';
  const n = Number(score);
  if (!Number.isFinite(n)) return '—';
  const clamped = Math.min(Math.max(n, 0), 1);
  try {
    return new Intl.NumberFormat(activeIntlLocale(), {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(clamped);
  } catch {
    return `${Math.round(clamped * 1000) / 10}%`;
  }
}

/** ms → detik ("1,5 dtk" / "1.5 s"). Null/NaN → '—'. */
export function formatDuration(ms?: number | null): string {
  if (ms == null) return '—';
  const n = Number(ms);
  if (!Number.isFinite(n)) return '—';
  const locale = activeIntlLocale();
  const isEn = locale.startsWith('en');
  const seconds = n / 1000;
  let num: string;
  try {
    num = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(seconds);
  } catch {
    num = String(Math.round(seconds * 100) / 100);
  }
  return isEn ? `${num} s` : `${num} dtk`;
}
