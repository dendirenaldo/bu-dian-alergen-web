import { API_BASE_URL } from './constants';

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
  isFormData?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token, isFormData = false } = options;

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw {
        statusCode: response.status,
        message: error.message || 'Request failed',
        errors: error.errors,
      };
    }

    return response.json();
  }

  get<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { token });
  }

  post<T>(endpoint: string, body?: any, token?: string, isFormData?: boolean) {
    return this.request<T>(endpoint, { method: 'POST', body, token, isFormData });
  }

  put<T>(endpoint: string, body?: any, token?: string) {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  }

  delete<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_BASE_URL);
