import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/constants', () => ({ API_BASE_URL: 'http://api.test' }));

import { datasetStatusVariant, mediaUrl, datasetQualityVariant } from '@/lib/dataset-meta';

describe('dataset meta helpers', () => {
  it('mediaUrl memetakan /uploads ke origin API dan membiarkan URL absolut', () => {
    expect(mediaUrl('/uploads/a.png')).toBe('http://api.test/uploads/a.png');
    expect(mediaUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
    expect(mediaUrl('data:image/png;base64,xx')).toBe('data:image/png;base64,xx');
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });

  it('varian status/quality konsisten dengan makna', () => {
    expect(datasetStatusVariant('approved')).toBe('success');
    expect(datasetStatusVariant('pending_review')).toBe('info');
    expect(datasetStatusVariant('needs_correction')).toBe('warning');
    expect(datasetStatusVariant('rejected')).toBe('danger');
    expect(datasetQualityVariant('error')).toBe('danger');
    expect(datasetQualityVariant('ok')).toBe('success');
  });
});
