/**
 * Batas keamanan mode simulasi onboarding.
 *
 * Modul ini sengaja bebas React dan tanpa dependensi, sehingga bisa diimpor
 * oleh lapisan transport (api client) maupun test. Saat panduan aktif,
 * permintaan tulis (POST/PUT/PATCH/DELETE) dan seluruh endpoint ekspor
 * diblokir secara struktural — bukan hanya "tombol yang tidak dipanggil".
 */
let simulationActive = false;

declare global {
  interface Window {
    __SIMULATION_ACTIVE__?: boolean;
  }
}

export class SimulationBlockedError extends Error {
  readonly code = 'SIMULATION_BLOCKED';
  constructor(message = 'Aksi diblokir: mode simulasi onboarding aktif.') {
    super(message);
    this.name = 'SimulationBlockedError';
  }
}

export function setSimulationActive(active: boolean): void {
  simulationActive = active;
  if (typeof window !== 'undefined') {
    window.__SIMULATION_ACTIVE__ = active;
  }
}

export function isSimulationActive(): boolean {
  if (simulationActive) return true;
  if (typeof window !== 'undefined') return window.__SIMULATION_ACTIVE__ === true;
  return false;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Endpoint yang tidak boleh diakses saat simulasi walau method-nya GET. */
const SIMULATION_FORBIDDEN_ENDPOINTS = [/\/dataset-items\/export/i, /\/dataset-items\/download/i, /\/detections\//i];

/**
 * Panggil sebelum setiap request. Melempar SimulationBlockedError jika
 * request dapat mengubah produksi atau menjalankan proses berat.
 */
export function assertLiveRequest(method: string, url: string): void {
  if (!isSimulationActive()) return;
  const m = String(method ?? 'GET').toUpperCase();
  const mutating = MUTATING.has(m);
  const forbidden = SIMULATION_FORBIDDEN_ENDPOINTS.some((re) => re.test(String(url ?? '')));
  if (mutating || forbidden) {
    throw new SimulationBlockedError(
      `Simulasi aktif: ${m} ${url} tidak diizinkan. Gunakan layanan simulasi.`,
    );
  }
}
