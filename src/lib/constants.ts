export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    BY_SLUG: (slug: string) => `/api/v1/contents/${slug}`,
  },
  DASHBOARD: {
    STATS: '/api/v1/dashboard/stats',
    RECENT: '/api/v1/dashboard/recent',
  },
};

export const APP_NAME = 'Bu Dian';
export const APP_DESCRIPTION = 'Sistem Deteksi Alergen Makanan';

import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Users,
  FileText,
  ScanSearch,
} from 'lucide-react';

export const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/allergens', label: 'Allergens', icon: AlertTriangle },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/cms', label: 'CMS', icon: FileText },
  { href: '/admin/detections', label: 'Detections', icon: ScanSearch },
];
