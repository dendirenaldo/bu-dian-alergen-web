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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw {
        statusCode: response.status,
        message: friendlyMessage(response.status, error.message),
        errors: error.errors,
        raw: error,
      };
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
