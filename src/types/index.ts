export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  isActive?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
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

export interface RegisterResponse {
  data: {
    user: User;
    message: string;
  };
}

export interface VerifyEmailResponse {
  data: {
    message: string;
  };
}

export interface ResendVerificationResponse {
  data: {
    message: string;
  };
}

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

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

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

export type DetectionMethod = 'image_ocr' | 'text_input';
export type DetectionResultType = 'safe' | 'unsafe';
export type DetectionModelChoice = 'bilstm' | 'bert' | 'ensemble';

export interface DetectedAllergen {
  allergenId: number;
  name: string;
  severityLevel: AllergenSeverity;
  confidenceScore: number;
}

export interface Detection {
  id: number;
  userId: number | null;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  product?: Product;
  imageUrl?: string;
  ocrText?: string;
  rawModelOutput?: any;
  result: DetectionResultType;
  confidenceScore: number;
  processingTimeMs: number;
  detectionMethod: DetectionMethod;
  modelName?: string;
  isGuest?: boolean;
  notes?: string;
  detectionAllergens?: DetectedAllergen[];
  createdAt: string;
}

export interface PublicQuota {
  limit: number;
  remaining: number;
  used: number;
}

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

export type DatasetStatus = 'draft' | 'verified';
export type DatasetGoldLabel = 'safe' | 'unsafe';

export interface CorrectedAllergenItem {
  name: string;
  severity: AllergenSeverity;
  confidence: number;
}

export interface DatasetItem {
  id: number;
  detectionId?: number | null;
  detection_id?: number | null;
  source?: string;
  ocrText?: string | null;
  ocr_text?: string | null;
  correctedText?: string | null;
  corrected_text?: string | null;
  goldLabel: DatasetGoldLabel;
  gold_label?: DatasetGoldLabel;
  correctedAllergens?: CorrectedAllergenItem[] | null;
  corrected_allergens?: CorrectedAllergenItem[] | null;
  status: DatasetStatus;
  verifiedBy?: number | null;
  verified_by?: number | null;
  verifiedAt?: string | null;
  verified_at?: string | null;
  notes?: string | null;
  detection?: Detection | null;
  verifier?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DatasetEstimate {
  bytes: number;
  fileCount: number;
  breakdown?: {
    datasetCsv?: { bytes: number; rows: number };
    manifestCsv?: { bytes: number; rows: number };
    images?: { bytes: number; count: number; missing?: number };
    splitJson?: { bytes: number };
    readmeTxt?: { bytes: number };
  };
}
