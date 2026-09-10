import { api } from './api';
import { API_ENDPOINTS } from './constants';
import { AuthResponse, ApiResponse, User } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data),

  getProfile: (token: string) =>
    api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE, token),
};
