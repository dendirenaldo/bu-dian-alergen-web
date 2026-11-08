'use client';

import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export const GUIDED_TOUR_STORAGE_KEY = 'guided_tour_v1';

export type GuidedTourLocale = 'id' | 'en';

interface TourCopy {
  title: string;
  description: string;
}

function copies(locale: GuidedTourLocale): TourCopy[] {
  if (locale === 'en') {
    return [
      {
        title: '1. Choose a model',
        description:
          'Pick how careful the check is. BERT is the most thorough, BiLSTM is the fastest, Ensemble combines both.',
      },
      {
        title: '2. Photo tab',
        description:
          'Use this tab if you have a photo of the food label. Switch here before uploading.',
      },
      {
        title: '3. Drop your photo here',
        description:
          'Good example: upright, focused, bright photo showing the full ingredient list. Bad example: blurry, tilted, cropped, or dark photo — the text cannot be read.',
      },
      {
        title: '4. Text tab',
        description:
          'No photo? Switch to Text and type or paste the ingredient list, e.g. "wheat flour, sugar, milk".',
      },
      {
        title: '5. Check button',
        description:
          'Press the check button to start. It takes a few seconds — please wait until the result appears.',
      },
      {
        title: '6. Read the result',
        description:
          'Green means no allergen found, red means an allergen was found with a confidence score. This is only an estimate, not a medical diagnosis — always double-check the label.',
      },
      {
        title: '7. Quota & login',
        description:
          'Guests can check a few times per hour. Log in for unlimited history and full features. Try the practice examples first — they are free and not saved.',
      },
    ];
  }
  return [
    {
      title: '1. Pilih model',
      description:
        'Pilih seberapa teliti pemeriksaan. BERT paling teliti, BiLSTM paling cepat, Ensemble gabungan keduanya.',
    },
    {
      title: '2. Tab Gambar',
      description:
        'Gunakan tab ini kalau Anda punya foto label kemasan. Pindah ke sini sebelum mengunggah foto.',
    },
    {
      title: '3. Taruh foto di sini',
      description:
        'Contoh baik: foto tegak, fokus, terang, seluruh daftar bahan terlihat. Contoh buruk: buram, miring, terpotong, atau gelap — tulisannya tidak terbaca.',
    },
    {
      title: '4. Tab Teks',
      description:
        'Tidak ada foto? Pindah ke Teks lalu ketik atau tempel daftar bahan, mis. "tepung terigu, gula, susu".',
    },
    {
      title: '5. Tombol Periksa',
      description:
        'Tekan tombol periksa untuk mulai. Butuh beberapa detik — tunggu sampai hasil muncul.',
    },
    {
      title: '6. Baca hasil',
      description:
        'Hijau artinya tidak ditemukan alergen, merah artinya ditemukan alergen beserta skor keyakinan. Ini hanya perkiraan, bukan vonis medis — selalu cek ulang label kemasan.',
    },
    {
      title: '7. Kuota & masuk',
      description:
        'Tamu dibatasi beberapa kali per jam. Masuk untuk riwayat tak terbatas dan fitur lengkap. Coba dulu contoh latihan — gratis dan tidak disimpan.',
    },
  ];
}

const SELECTORS = [
  '[data-tour="model-card"]',
  '[data-tour="tab-image"]',
  '[data-tour="dropzone"]',
  '[data-tour="tab-text"]',
  '[data-tour="detect-button"]',
  '[data-tour="result"]',
  '[data-tour="quota"]',
] as const;

/** 7 langkah tur halaman /detect. Elemen hasil & kuota boleh belum ada → dilewati aman. */
export function buildGuidedTourSteps(locale: GuidedTourLocale = 'id'): DriveStep[] {
  const list = copies(locale);
  return SELECTORS.map((element, i) => ({
    element,
    popover: {
      title: list[i].title,
      description: list[i].description,
      side: i === 0 ? 'bottom' : 'top',
      align: 'start',
    },
    // Lewati langkah yang elemennya belum tampil (mis. hasil sebelum ada deteksi).
    skipMissingElement: true,
  }));
}

function markTourSeen(): void {
  try {
    window.localStorage.setItem(GUIDED_TOUR_STORAGE_KEY, '1');
  } catch {
    /* abaikan */
  }
}

export function hasSeenGuidedTour(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(GUIDED_TOUR_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function resetGuidedTour(): void {
  try {
    window.localStorage.removeItem(GUIDED_TOUR_STORAGE_KEY);
  } catch {
    /* abaikan */
  }
}

/** Jalankan tur 7 langkah. Aman dipanggil berulang (tombol Panduan). */
export function startGuidedTour(locale: GuidedTourLocale = 'id'): void {
  if (typeof window === 'undefined') return;
  const d = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    allowClose: true,
    smoothScroll: true,
    nextBtnText: locale === 'en' ? 'Next' : 'Lanjut',
    prevBtnText: locale === 'en' ? 'Back' : 'Kembali',
    doneBtnText: locale === 'en' ? 'Done' : 'Selesai',
    progressText: '{current} / {total}',
    steps: buildGuidedTourSteps(locale),
    onDestroyed: () => {
      markTourSeen();
    },
  });
  d.drive();
}

/**
 * Otomatis jalankan sekali per browser (localStorage `guided_tour_v1`).
 * Dipanggil dari useEffect halaman /detect.
 */
export function maybeStartGuidedTourAuto(locale: GuidedTourLocale = 'id', delayMs = 600): () => void {
  if (typeof window === 'undefined') return () => undefined;
  if (hasSeenGuidedTour()) return () => undefined;
  const t = window.setTimeout(() => {
    // Tandai dulu agar StrictMode / navigasi cepat tidak memicu dua kali.
    markTourSeen();
    startGuidedTour(locale);
  }, delayMs);
  return () => window.clearTimeout(t);
}
