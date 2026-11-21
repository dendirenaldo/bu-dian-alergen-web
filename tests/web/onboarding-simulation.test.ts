import { describe, expect, it } from 'vitest';
import { TUTORIALS, tutorialsForRole } from '@/onboarding/tutorials';
import {
  computeSimPreview,
  computeSimStatistics,
  createSimDatasetRecords,
  createSimExportRecord,
  simText,
} from '@/onboarding/simulation-data';

describe('registri tutorial', () => {
  it('memfilter tutorial sesuai peran', () => {
    const admin = tutorialsForRole('admin');
    const user = tutorialsForRole('user');
    expect(admin.length).toBeGreaterThan(user.length);
    expect(admin.some((t) => t.id === 'dataset-list')).toBe(true);
    expect(user.some((t) => t.id === 'dataset-list')).toBe(false);
    expect(user.some((t) => t.id === 'detect')).toBe(true);
  });

  it('setiap langkah punya target/aksi yang jelas dan rute valid', () => {
    for (const tutorial of TUTORIALS) {
      expect(tutorial.route.startsWith('/')).toBe(true);
      expect(tutorial.steps.length).toBeGreaterThan(0);
      for (const step of tutorial.steps) {
        expect(step.titleKey).toMatch(/^tour\./);
        expect(step.bodyKey).toMatch(/^tour\./);
        if (step.action) {
          expect(!!step.action.event || step.action.type === 'navigate').toBe(true);
        }
        if (step.target) expect(step.target.startsWith('[')).toBe(true);
      }
    }
  });

  it('tur lengkap hanya untuk admin dan mencakup lintas modul', () => {
    const full = TUTORIALS.find((t) => t.id === 'full');
    expect(full?.roles).toEqual(['admin']);
    expect(new Set(full?.steps.map((s) => s.route)).size).toBeGreaterThan(1);
  });
});

describe('data simulasi dataset', () => {
  it('semua record simulasi ber-ID negatif dan ditandai', () => {
    const records = createSimDatasetRecords();
    expect(records.length).toBeGreaterThanOrEqual(4);
    expect(records.every((r) => r.id < 0 && r.isSimulation)).toBe(true);
    expect(records.every((r) => simText(r).length > 0)).toBe(true);
  });

  it('statistik simulasi konsisten dengan record', () => {
    const records = createSimDatasetRecords();
    const stats = computeSimStatistics(records);
    expect(stats.totals.total).toBe(records.length);
    expect(stats.totals.approved).toBe(records.filter((r) => r.status === 'approved').length);
    expect(stats.totals.awaitingReview).toBe(records.filter((r) => r.status === 'pending_review').length);
    expect(stats.allergenDistribution.length).toBeGreaterThan(0);
    expect(stats.growth).toHaveLength(14);
  });

  it('pratinjau ekspor menyaring status dan menghitung split tanpa tumpang tindih', () => {
    const records = createSimDatasetRecords();
    const preview = computeSimPreview(records, { profile: 'nlp', format: 'jsonl', status: 'approved' });
    expect(preview.counts.eligible).toBe(1);
    expect(preview.split?.counts.total).toBe(1);
    expect(preview.integrity.auditPassed).toBe(true);

    const all = computeSimPreview(records, { profile: 'nlp', format: 'jsonl', status: 'draft,approved' });
    expect(all.counts.eligible).toBe(2);
    const ids = [...(all.split?.splits.train ?? []), ...(all.split?.splits.validation ?? []), ...(all.split?.splits.test ?? [])];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('profil gambar mengecualikan record tanpa gambar dengan alasan', () => {
    const records = createSimDatasetRecords();
    const preview = computeSimPreview(records, {
      profile: 'image_classification',
      format: 'csv',
      status: 'approved,draft',
      includeImages: true,
    });
    expect(preview.excluded.every((x) => x.reason === 'missing_image')).toBe(true);
    expect(preview.excluded.length).toBeGreaterThan(0);
  });

  it('riwayat ekspor simulasi memakai ID negatif dan tidak menyentuh produksi', () => {
    const records = createSimDatasetRecords();
    const rec = createSimExportRecord(records, { profile: 'nlp', format: 'jsonl', status: 'approved' }, 1);
    expect(rec.id).toBeLessThan(0);
    expect(rec.exportId).toMatch(/^exp_sim_/);
    expect(rec.recordCount).toBe(1);
  });
});
