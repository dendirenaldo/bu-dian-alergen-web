import { Detection } from '@/types';

/**
 * Contoh latihan lokal untuk halaman /detect.
 * Seluruh data di bawah ini MOCK — tidak dikirim ke backend,
 * tidak disimpan ke riwayat, dan tidak mengurangi kuota tamu.
 * ID negatif dipakai agar mudah dikenali sebagai demo.
 */

export const DEMO_SAFE: Detection = {
  id: -1,
  userId: null,
  product: {
    id: -1,
    name: 'Aqua Air Mineral 600 ml',
    slug: 'aqua-air-mineral-600ml',
    brand: 'Aqua',
    createdAt: '2026-11-01T09:12:00.000Z',
  },
  ocrText:
    'AQUA AIR MINERAL 600 ml\n' +
    'Komposisi: Air mineral alami dari sumber pegunungan.\n' +
    'Diproduksi oleh PT Aqua Golden Mississippi, Sukabumi.\n' +
    'Berat bersih: 600 ml. Baik digunakan sebelum: 12-2027.',
  result: 'safe',
  confidenceScore: 0.98,
  processingTimeMs: 760,
  detectionMethod: 'image_ocr',
  modelName: 'ensemble',
  isGuest: true,
  detectionAllergens: [],
  rawModelOutput: { model_name: 'ensemble', allergens: [] },
  createdAt: '2026-11-01T09:12:00.000Z',
};

export const DEMO_DANGEROUS: Detection = {
  id: -2,
  userId: null,
  product: {
    id: -2,
    name: 'Indomie Goreng Original 85 g',
    slug: 'indomie-goreng-original-85g',
    brand: 'Indomie',
    createdAt: '2026-11-02T14:05:00.000Z',
  },
  ocrText:
    'INDOMIE GORENG 85 g\n' +
    'Komposisi: Tepung terigu, minyak nabati, garam, gula, kecap manis (mengandung kedelai), ' +
    'telur bubuk, udang bubuk, bawang putih bubuk, pewarna karamel.\n' +
    'Mengandung alergen: gandum (gluten), telur, kedelai, udang.\n' +
    'Berat bersih: 85 g.',
  result: 'unsafe',
  confidenceScore: 0.92,
  processingTimeMs: 1240,
  detectionMethod: 'image_ocr',
  modelName: 'bert',
  isGuest: true,
  detectionAllergens: [
    { allergenId: 1, name: 'Gluten (gandum)', severityLevel: 'high', confidenceScore: 0.95 },
    { allergenId: 2, name: 'Telur', severityLevel: 'high', confidenceScore: 0.91 },
    { allergenId: 3, name: 'Udang', severityLevel: 'high', confidenceScore: 0.89 },
  ],
  rawModelOutput: {
    model_name: 'bert',
    allergens: [
      { name: 'Gluten (gandum)', severity: 'high', confidence: 0.95 },
      { name: 'Telur', severity: 'high', confidence: 0.91 },
      { name: 'Udang', severity: 'high', confidence: 0.89 },
    ],
  },
  createdAt: '2026-11-02T14:05:00.000Z',
};

export const DEMO_MODERATE: Detection = {
  id: -3,
  userId: null,
  product: {
    id: -3,
    name: 'Good Time Cookies Cokelat 144 g',
    slug: 'good-time-cookies-cokelat-144g',
    brand: 'Good Time',
    createdAt: '2026-11-03T10:40:00.000Z',
  },
  ocrText:
    'GOOD TIME COOKIES 144 g\n' +
    'Komposisi: Tepung terigu, gula, margarin (mengandung susu), keping cokelat 15%, ' +
    'telur, garam, pengembang, perisa vanila.\n' +
    'Mengandung alergen: gandum, susu, telur.\n' +
    'Diproduksi di fasilitas yang juga mengolah kacang tanah.',
  result: 'unsafe',
  confidenceScore: 0.85,
  processingTimeMs: 980,
  detectionMethod: 'text_input',
  modelName: 'bilstm',
  isGuest: true,
  detectionAllergens: [
    { allergenId: 4, name: 'Susu', severityLevel: 'medium', confidenceScore: 0.86 },
    { allergenId: 5, name: 'Telur', severityLevel: 'medium', confidenceScore: 0.83 },
  ],
  rawModelOutput: {
    model_name: 'bilstm',
    allergens: [
      { name: 'Susu', severity: 'medium', confidence: 0.86 },
      { name: 'Telur', severity: 'medium', confidence: 0.83 },
    ],
  },
  createdAt: '2026-11-03T10:40:00.000Z',
};

export const DEMO_SAMPLES: Detection[] = [DEMO_SAFE, DEMO_DANGEROUS, DEMO_MODERATE];

export const DEMO_SAMPLE_IDS: number[] = DEMO_SAMPLES.map((d) => d.id);

/** True bila detection berasal dari mode latihan (ID negatif / terdaftar di DEMO_SAMPLE_IDS). */
export function isDemoDetection(detection: Detection | null | undefined): boolean {
  if (!detection) return false;
  return DEMO_SAMPLE_IDS.includes(detection.id);
}

export type DemoSampleKey = 'safe' | 'dangerous' | 'moderate';

export const DEMO_SAMPLE_MAP: Record<DemoSampleKey, Detection> = {
  safe: DEMO_SAFE,
  dangerous: DEMO_DANGEROUS,
  moderate: DEMO_MODERATE,
};
