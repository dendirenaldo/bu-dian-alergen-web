/**
 * Koersi JSON defensif untuk kolom yang di MariaDB tersimpan sebagai LONGTEXT.
 *
 * Backend dapat mengirim nilai JSON sebagai **string** (bukan objek/array).
 * Helper ini dipakai di semua titik baca `rawModelOutput` / `correctedAllergens` /
 * `corrected_allergens` agar UI tidak diam-diam kosong saat menerima string.
 */

export function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== 'string') return raw as T;
  const s = raw.trim();
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Selalu kembalikan array (string LONGTEXT di-parse; selain itu fallback). */
export function asArray<T = unknown>(raw: unknown, fallback: T[] = []): T[] {
  const v = parseJsonField<unknown>(raw, fallback);
  return Array.isArray(v) ? (v as T[]) : fallback;
}

/** Selalu kembalikan objek non-array (string LONGTEXT di-parse; selain itu fallback). */
export function asObject<T extends Record<string, any> = Record<string, any>>(
  raw: unknown,
  fallback: T = {} as T,
): T {
  const v = parseJsonField<unknown>(raw, fallback);
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v as T;
  return fallback;
}
