import { api } from './api';
import { API_ENDPOINTS } from './constants';
import { AuthResponse, ApiResponse, User, RegisterResponse, VerifyEmailResponse, ResendVerificationResponse } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data),

  getProfile: (token: string) =>
    api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE, token),

  verifyEmail: (token: string) =>
    api.post<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),

  resendVerification: (email: string) =>
    api.post<ResendVerificationResponse>(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword }),

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    api.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      { currentPassword, newPassword },
      token,
    ),
};
