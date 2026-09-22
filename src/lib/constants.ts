// Fail-fast: env wajib diset oleh .env.production / .env.development
// (keduanya ter-commit). Tanpa fallback localhost agar misconfig ketahuan
// saat build/runtime, bukan diam-diam menunjuk mesin developer.
const _apiBase = process.env.NEXT_PUBLIC_API_URL;
if (!_apiBase) {
  throw new Error(
    'NEXT_PUBLIC_API_URL tidak diset. Isi .env.production/.env.development.',
  );
}
export const API_BASE_URL = _apiBase;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    PROFILE: '/api/v1/auth/profile',
  },
  USERS: {
    LIST: '/api/v1/users',
    DETAIL: (id: number) => `/api/v1/users/${id}`,
  },
  CATEGORIES: {
    LIST: '/api/v1/categories',
    DETAIL: (id: number) => `/api/v1/categories/${id}`,
  },
  PRODUCTS: {
    LIST: '/api/v1/products',
    DETAIL: (id: number) => `/api/v1/products/${id}`,
  },
  ALLERGENS: {
    LIST: '/api/v1/allergens',
    DETAIL: (id: number) => `/api/v1/allergens/${id}`,
  },
  DETECTIONS: {
    UPLOAD: '/api/v1/detections/upload',
    TEXT: '/api/v1/detections/text',
    LIST: '/api/v1/detections',
    DETAIL: (id: number) => `/api/v1/detections/${id}`,
  },
  CONTENTS: {
    LIST: '/api/v1/contents',
    DETAIL: (id: number) => `/api/v1/contents/${id}`,
    BY_SLUG: (slug: string) => `/api/v1/contents/${slug}`,
  },
  SETTINGS: {
    LIST: '/api/v1/settings',
    DETAIL: (key: string) => `/api/v1/settings/${key}`,
    PUBLIC: '/api/v1/settings/public',
  },
  DASHBOARD: {
    STATS: '/api/v1/dashboard/stats',
    RECENT: '/api/v1/dashboard/recent',
    TREND: '/api/v1/dashboard/trend',
  },
};

export const APP_NAME = 'Allergen Detector';



