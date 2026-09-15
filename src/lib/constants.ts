const _apiBase = process.env.NEXT_PUBLIC_API_URL;
if (!_apiBase && typeof window !== 'undefined') {
  throw new Error(
    'NEXT_PUBLIC_API_URL belum diset. Isi .env.production/.env.development; fallback localhost dihapus agar misconfig gagal-cepat.'
  );
}
export const API_BASE_URL = _apiBase || 'http://localhost:3001';

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
  },
  DASHBOARD: {
    STATS: '/api/v1/dashboard/stats',
    RECENT: '/api/v1/dashboard/recent',
    TREND: '/api/v1/dashboard/trend',
  },
};

export const APP_NAME = 'Allergen Detector';
export const APP_DESCRIPTION = 'Sistem Deteksi Alergen Makanan';




