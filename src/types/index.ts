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

export type DatasetStatus =
  | 'draft'
  | 'pending_review'
  | 'needs_correction'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'archived';
export type DatasetGoldLabel = 'safe' | 'unsafe';
export type DatasetQualityStatus = 'unassessed' | 'ok' | 'warning' | 'error';
export type AllergenPresence =
  | 'present'
  | 'absent'
  | 'unknown'
  | 'may_contain'
  | 'cross_contamination'
  | 'not_stated'
  | 'not_evaluated';
export type DatasetSource = 'detection' | 'manual' | 'import' | 'user_submission';
export type ExportProfile = 'raw' | 'nlp' | 'image_classification' | 'multimodal';
export type ExportFormat = 'jsonl' | 'csv' | 'json';

export interface CorrectedAllergenItem {
  name: string;
  severity: AllergenSeverity;
  confidence: number;
  presence?: AllergenPresence;
  evidence?: string;
}

export interface DatasetValidationIssue {
  code: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
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

  // Metadata platform
  productName?: string | null;
  brand?: string | null;
  category?: string | null;
  barcode?: string | null;
  acquisitionSource?: string | null;
  acquisitionContext?: string | null;
  sourceAppVersion?: string | null;
  submittedBy?: number | null;
  submittedAt?: string | null;
  imageUrl?: string | null;
  imageType?: string | null;
  imageMime?: string | null;
  imageSize?: number | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageChecksum?: string | null;
  originalFilename?: string | null;
  storedFilename?: string | null;
  ingredientText?: string | null;
  normalizedIngredients?: string[] | null;
  ocrEngine?: string | null;
  ocrEngineVersion?: string | null;
  ocrStatus?: string | null;
  ocrError?: string | null;
  ocrProcessedAt?: string | null;
  annotationSource?: string | null;
  annotationVersion?: string | null;
  annotationSchemaVersion?: string | null;
  annotatorId?: number | null;
  annotatedAt?: string | null;
  qualityStatus?: DatasetQualityStatus;
  validationErrors?: DatasetValidationIssue[] | null;
  exportEligible?: boolean;
  duplicateOf?: number | null;
  duplicateHash?: string | null;
  reviewNote?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  reviewer?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  submitter?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;

  detection?: Detection | null;
  verifier?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  createdAt: string;
  updatedAt?: string;
  /** true = record simulasi onboarding (tidak pernah dikirim ke backend). */
  isSimulation?: boolean;
}

export interface DatasetAuditEntry {
  id: number;
  action: string;
  actorId?: number | null;
  meta?: Record<string, any> | null;
  createdAt: string;
}

export interface DatasetStatistics {
  totals: {
    total: number;
    awaitingReview: number;
    needsCorrection: number;
    verified: number;
    approved: number;
    rejected: number;
    draft: number;
    archived: number;
    exportable: number;
    missingImage: number;
    missingText: number;
    duplicates: number;
    ocrFailed: number;
    qualityError: number;
    qualityWarning: number;
    qualityOk: number;
  };
  statusCounts: Record<string, number>;
  qualityCounts: Record<string, number>;
  labelCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  acquisitionCounts: Record<string, number>;
  allergenDistribution: Array<{ name: string; count: number }>;
  growth: Array<{ date: string; count: number }>;
  generatedAt: string;
}

export interface DatasetSplitInfo {
  seed: number;
  ratios: { train: number; validation: number; test: number };
  strategy: string;
  groupBy: string;
  splits: { train: number[]; validation: number[]; test: number[] };
  counts: { train: number; validation: number; test: number; total: number };
  groupCount: number;
  audit: Array<{ comparison: string; overlap: number; status: 'PASS' | 'FAIL' }>;
  labelDistribution: Record<string, { train: number; validation: number; test: number }>;
  duplicateGroupCount: number;
  warning?: string;
}

export interface DatasetExportPreview {
  profile: ExportProfile;
  format: ExportFormat;
  filters: Record<string, unknown>;
  counts: {
    selected: number;
    eligible: number;
    excluded: number;
    images: number;
    missingImages: number;
    labels: { safe: number; unsafe: number };
  };
  labelDistribution: Record<string, number>;
  allergenDistribution: Array<{ name: string; count: number }>;
  split: DatasetSplitInfo | null;
  excluded: Array<{ id: number; reason: string }>;
  warnings: Array<{ code: string; message: string; recordIds?: number[] }>;
  integrity: {
    duplicateIds: number;
    missingImages: number;
    validationErrors: number;
    validationWarnings: number;
    auditPassed: boolean;
    missingText: number;
  };
  estimatedBytes: number;
}

export interface DatasetExportRecord {
  id: number;
  exportId: string;
  profile: ExportProfile;
  format: ExportFormat;
  status: string;
  recordCount: number;
  imageCount: number;
  bytes: number;
  filename: string;
  checksum: string;
  config: Record<string, unknown>;
  warnings: Array<{ code: string; message: string }>;
  excluded: Array<{ id: number; reason: string }>;
  manifest: Record<string, any> | null;
  createdAt: string;
  downloadUrl: string;
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
