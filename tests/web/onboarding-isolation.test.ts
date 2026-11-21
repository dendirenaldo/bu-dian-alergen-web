import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/constants', () => ({
  API_BASE_URL: 'http://test.local',
  API_ENDPOINTS: {
    DATASET: {
      LIST: '/api/v1/dataset-items',
      DETAIL: (id: number) => `/api/v1/dataset-items/${id}`,
      EXPORT: '/api/v1/dataset-items/export',
    },
  },
}));

import { api, apiFetch } from '@/lib/api';
import {
  SimulationBlockedError,
  assertLiveRequest,
  isSimulationActive,
  setSimulationActive,
} from '@/onboarding/runtime';

function okResponse(data: unknown = { data: { ok: true } }) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
  } as unknown as Response;
}

afterEach(() => {
  setSimulationActive(false);
  vi.restoreAllMocks();
});

describe('isolasi mutasi mode simulasi', () => {
  it('mode live mengizinkan mutasi dan memanggil fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    expect(isSimulationActive()).toBe(false);
    await api.patch('/api/v1/dataset-items/1', { note: 'x' }, 'token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('mode simulasi memblokir POST/PATCH/PUT/DELETE sebelum jaringan', async () => {
    setSimulationActive(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());

    for (const call of [
      () => api.post('/api/v1/dataset-items', { a: 1 }, 't'),
      () => api.patch('/api/v1/dataset-items/1', { a: 1 }, 't'),
      () => api.put('/api/v1/dataset-items/1', { a: 1 }, 't'),
      () => api.delete('/api/v1/dataset-items/1', 't'),
    ]) {
      await expect(call()).rejects.toBeInstanceOf(SimulationBlockedError);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mode simulasi memblokir endpoint ekspor walau GET', async () => {
    setSimulationActive(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    await expect(api.get('/api/v1/dataset-items/export?format=csv', 't')).rejects.toBeInstanceOf(
      SimulationBlockedError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mode simulasi masih mengizinkan GET baca biasa', async () => {
    setSimulationActive(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    await api.get('/api/v1/dataset-items?page=1', 't');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('apiFetch ikut diblokir untuk mutasi', async () => {
    setSimulationActive(true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    await expect(apiFetch('/api/v1/dataset-items/1/image', { method: 'POST' })).rejects.toBeInstanceOf(
      SimulationBlockedError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('assertLiveRequest tidak melempar saat mode live', () => {
    expect(() => assertLiveRequest('DELETE', '/api/v1/dataset-items/1')).not.toThrow();
    expect(() => assertLiveRequest('GET', '/api/v1/dataset-items')).not.toThrow();
  });

  it('flag global tercermin di window untuk pemeriksaan eksternal', () => {
    setSimulationActive(true);
    expect(window.__SIMULATION_ACTIVE__).toBe(true);
    setSimulationActive(false);
    expect(window.__SIMULATION_ACTIVE__).toBe(false);
  });
});
