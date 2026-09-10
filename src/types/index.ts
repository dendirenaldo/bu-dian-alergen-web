// Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  isActive?: boolean;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
}

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  category?: Category;
  brand?: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
  ingredients?: Ingredient[];
  createdBy?: number;
  isActive?: boolean;
  createdAt: string;
}

export interface Ingredient {
  id: number;
  productId: number;
  text: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

// Allergen types
export type AllergenSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Allergen {
  id: number;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  severityLevel: AllergenSeverity;
  color?: string;
  isActive: boolean;
}

// Detection types
export type DetectionMethod = 'image_ocr' | 'text_input';
export type DetectionResultType = 'safe' | 'unsafe';

export interface DetectedAllergen {
  allergenId: number;
  name: string;
  severityLevel: AllergenSeverity;
  confidenceScore: number;
}

export interface Detection {
  id: number;
  userId: number;
  product?: Product;
  imageUrl?: string;
  ocrText?: string;
  rawModelOutput?: any;
  result: DetectionResultType;
  confidenceScore: number;
  processingTimeMs: number;
  detectionMethod: DetectionMethod;
  notes?: string;
  detectionAllergens?: DetectedAllergen[];
  createdAt: string;
}

// Content types (CMS)
export type ContentType = 'page' | 'article' | 'announcement';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Content {
  id: number;
  title: string;
  slug: string;
  body?: string;
  excerpt?: string;
  type: ContentType;
  status: ContentStatus;
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
}

// API types
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalDetections: number;
  totalAllergens: number;
  safeCount: number;
  unsafeCount: number;
}
