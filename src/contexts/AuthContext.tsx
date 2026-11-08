import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/lib/auth';

const PENDING_EMAIL_KEY = 'pendingEmail';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerification: (email: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readPendingEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(PENDING_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);

  useEffect(() => {
    setPendingEmailState(readPendingEmail());
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      authService
        .getProfile(storedToken)
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setPendingEmail = useCallback((email: string | null) => {
    setPendingEmailState(email);
    try {
      if (email) window.localStorage.setItem(PENDING_EMAIL_KEY, email);
      else window.localStorage.removeItem(PENDING_EMAIL_KEY);
    } catch {
      /* abaikan */
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    return res.data.user as User;
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; phone?: string }) => {
      const res = await authService.register(data);
      // Backend tidak lagi mengembalikan token: jangan auto-login.
      // Simpan pendingEmail agar halaman check-email bisa dipakai.
      setPendingEmail(data.email);
      return res.data.user as User;
    },
    [setPendingEmail],
  );

  const verifyEmail = useCallback(async (verifyToken: string) => {
    const res = await authService.verifyEmail(verifyToken);
    const message = (res as any)?.data?.message ?? (res as any)?.message ?? '';
    // Verifikasi sukses -> pendingEmail tak lagi relevan bila cocok.
    return message as string;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const res = await authService.resendVerification(email);
    const message = (res as any)?.data?.message ?? (res as any)?.message ?? '';
    return message as string;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && user.emailVerified !== false,
        pendingEmail,
        setPendingEmail,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
