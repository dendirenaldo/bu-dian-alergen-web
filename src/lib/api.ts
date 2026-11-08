import { API_BASE_URL } from './constants';
import { tr } from './i18n';

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
  anonId?: string;
  isFormData?: boolean;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

/**
 * Bentuk error ter-normalisasi dari backend.
 * Backend selalu merespons `{ statusCode, message, code?, errors? }`
 * dengan `errors` berupa array `{ field, message }` (atau string).
 * Bentuk lama `fields[]` juga tetap didukung.
 */
export interface ApiError {
  /** HTTP status (alias: statusCode). */
  status: number;
  statusCode: number;
  message: string;
  /** Kode stabil backend, mis. EMAIL_TAKEN / TOKEN_EXPIRED. */
  code?: string;
  /** Petakan field -> pesan (dari errors[] / fields[]). */
  fieldErrors: Record<string, string>;
  raw?: unknown;
}

export function isApiError(err: unknown): err is ApiError {
  return (
    !!err &&
    typeof err === 'object' &&
    typeof (err as ApiError).status === 'number' &&
    typeof (err as ApiError).message === 'string' &&
    !!(err as ApiError).fieldErrors &&
    typeof (err as ApiError).fieldErrors === 'object'
  );
}

/** Ambil pesan ramah + lampirkan rincian field error bila ada. */
export function formatApiErrorMessage(err: unknown, fallbackKey = 'api.err.failed'): string {
  if (isApiError(err)) {
    const details = Object.entries(err.fieldErrors)
      .filter(([field]) => field !== '_form')
      .map(([, msg]) => msg);
    const formNote = err.fieldErrors._form;
    const parts = [err.message, ...details];
    if (formNote && !parts.includes(formNote)) parts.push(formNote);
    return parts.filter(Boolean).join(' ');
  }
  if (err && typeof err === 'object' && typeof (err as any).message === 'string') {
    return (err as any).message;
  }
  return tr(fallbackKey);
}

function friendlyMessage(status: number, serverMessage?: string) {
  if (serverMessage && serverMessage !== 'Request failed') return serverMessage;
  if (status === 400) return tr('api.err.invalid');
  if (status === 401) return tr('api.err.session');
  if (status === 403) return tr('api.err.forbidden');
  if (status === 404) return tr('api.err.notFound');
  if (status === 409) return tr('api.err.conflict');
  if (status === 413) return tr('api.err.tooLarge');
  if (status === 429) return tr('api.err.tooMany');
  if (status >= 500) return tr('api.err.server');
  return tr('api.err.failed');
}

function pushFieldError(out: Record<string, string>, field: unknown, message: unknown, fallbackMessage?: string) {
  const f = typeof field === 'string' && field.trim() ? field.trim() : '_form';
  const msg =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : typeof fallbackMessage === 'string' && fallbackMessage.trim()
        ? fallbackMessage.trim()
        : '';
  if (!msg) return;
  if (f === '_form') {
    if (!out._form) out._form = msg;
    return;
  }
  if (!(f in out)) out[f] = msg;
}

/**
 * Normalisasi `errors[]` (array string / {field,message} / {property,constraints})
 * dan `fields[]` (array string / {field,message}) menjadi Record field -> pesan.
 */
export function toFieldErrors(payload: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!payload || typeof payload !== 'object') return out;
  const fallbackMessage = typeof payload.message === 'string' ? payload.message : undefined;

  const errors = (payload as any).errors;
  if (Array.isArray(errors)) {
    for (const e of errors) {
      if (typeof e === 'string') {
        pushFieldError(out, '_form', e, fallbackMessage);
      } else if (e && typeof e === 'object') {
        const field = (e as any).field ?? (e as any).property ?? (e as any).param ?? '_form';
        const constraints = (e as any).constraints;
        const message =
          (e as any).message ??
          (constraints && typeof constraints === 'object'
            ? Object.values(constraints).join(', ')
            : undefined);
        pushFieldError(out, field, message, fallbackMessage);
      }
    }
  }

  const fields = (payload as any).fields;
  if (Array.isArray(fields)) {
    for (const f of fields) {
      if (typeof f === 'string') {
        pushFieldError(out, f, fallbackMessage, fallbackMessage);
      } else if (f && typeof f === 'object') {
        pushFieldError(
          out,
          (f as any).field ?? (f as any).name ?? '_form',
          (f as any).message,
          fallbackMessage,
        );
      }
    }
  }

  return out;
}

function toApiError(status: number, payload: any): ApiError {
  const message =
    typeof payload?.message === 'string' && payload.message
      ? friendlyMessage(status, payload.message)
      : friendlyMessage(status, undefined);
  const code = typeof payload?.code === 'string' ? payload.code : undefined;
  return {
    status,
    statusCode: status,
    message,
    ...(code ? { code } : {}),
    fieldErrors: toFieldErrors(payload),
    raw: payload,
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token, anonId, isFormData = false, signal, idempotencyKey } = options;

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (anonId) {
      headers['x-anon-id'] = anonId;
    }

    if (body && !isFormData && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (idempotencyKey && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      signal,
      credentials: 'include',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({ message: 'Request failed' }));
      throw toApiError(response.status, errorPayload);
    }

    return response.json();
  }

  get<T>(endpoint: string, token?: string, signal?: AbortSignal, anonId?: string) {
    return this.request<T>(endpoint, { token, signal, anonId });
  }

  post<T>(endpoint: string, body?: any, token?: string, opts?: { isFormData?: boolean; signal?: AbortSignal; idempotencyKey?: string; anonId?: string }) {
    return this.request<T>(endpoint, { method: 'POST', body, token, ...opts });
  }

  put<T>(endpoint: string, body?: any, token?: string, opts?: { signal?: AbortSignal; idempotencyKey?: string }) {
    return this.request<T>(endpoint, { method: 'PUT', body, token, ...opts });
  }

  patch<T>(endpoint: string, body?: any, token?: string, opts?: { signal?: AbortSignal; idempotencyKey?: string }) {
    return this.request<T>(endpoint, { method: 'PATCH', body, token, ...opts });
  }

  delete<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_BASE_URL);

export function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
