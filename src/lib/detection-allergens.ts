import { AllergenSeverity, Detection } from '@/types';

export interface ResolvedAllergen {
  key: string;
  name: string;
  severity: AllergenSeverity;
  confidence: number;
}

const SEVERITIES: AllergenSeverity[] = ['low', 'medium', 'high', 'critical'];

function toSeverity(v: unknown): AllergenSeverity {
  return SEVERITIES.includes(v as AllergenSeverity) ? (v as AllergenSeverity) : 'medium';
}

/**
 * Normalisasi daftar alergen dari 3 bentuk backend:
 * 1. Join-row dengan nested `allergen` (list/history/admin setelah fix include).
 * 2. Flat `{name, severityLevel, confidenceScore}`.
 * 3. Mentah ML di `rawModelOutput.allergens` (`{name, confidence, severity}`) —
 *    dipakai untuk respons create yang belum di-reload.
 */
export function resolveDetectedAllergens(detection: Detection): ResolvedAllergen[] {
  const rows = (detection.detectionAllergens ?? []) as any[];
  const fromRows = rows
    .map((a, i) => {
      const nested = a?.allergen ?? {};
      const name = String(a?.name ?? nested?.name ?? '').trim();
      if (!name) return null;
      return {
        key: `${a?.allergenId ?? nested?.id ?? i}-${name}`,
        name,
        severity: toSeverity(a?.severityLevel ?? a?.severity ?? nested?.severityLevel ?? nested?.severity),
        confidence: Number(a?.confidenceScore ?? a?.confidence ?? 0) || 0,
      } as ResolvedAllergen;
    })
    .filter(Boolean) as ResolvedAllergen[];
  if (fromRows.length > 0) return fromRows;

  const raw = (detection.rawModelOutput as any)?.allergens;
  if (Array.isArray(raw)) {
    return raw
      .map((a: any, i: number) => {
        const name = String(a?.name ?? '').trim();
        if (!name) return null;
        return {
          key: `raw-${i}-${name}`,
          name,
          severity: toSeverity(a?.severityLevel ?? a?.severity),
          confidence: Number(a?.confidenceScore ?? a?.confidence ?? 0) || 0,
        } as ResolvedAllergen;
      })
      .filter(Boolean) as ResolvedAllergen[];
  }
  return [];
}
