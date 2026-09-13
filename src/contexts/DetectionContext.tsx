import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { Detection } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ApiResponse } from '@/types';
import { unwrapData } from '@/lib/unwrap';
import { useAuth } from './AuthContext';

interface DetectionContextType {
  currentDetection: Detection | null;
  isDetecting: boolean;
  detectFromText: (text: string) => Promise<Detection>;
  detectFromImage: (file: File) => Promise<Detection>;
  cancelDetection: () => void;
  setCurrentDetection: (detection: Detection | null) => void;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export function DetectionProvider({ children }: { children: ReactNode }) {
  const [currentDetection, setCurrentDetection] = useState<Detection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { token } = useAuth();

  const detectFromText = useCallback(async (text: string): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsDetecting(true);
    try {
      const res = await api.post<ApiResponse<Detection>>(
        API_ENDPOINTS.DETECTIONS.TEXT,
        { text },
        token || undefined,
        { signal: ctrl.signal, idempotencyKey: newIdempotencyKey() },
      );
      const data = unwrapData<Detection>(res);
      setCurrentDetection(data);
      return data;
    } finally {
      if (abortRef.current === ctrl) { abortRef.current = null; setIsDetecting(false); }
    }
  }, [token, isDetecting]);

  const detectFromImage = useCallback(async (file: File): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<ApiResponse<Detection>>(
        API_ENDPOINTS.DETECTIONS.UPLOAD,
        formData,
        token || undefined,
        { isFormData: true, signal: ctrl.signal, idempotencyKey: newIdempotencyKey() },
      );
      const data = unwrapData<Detection>(res);
      setCurrentDetection(data);
      return data;
    } finally {
      if (abortRef.current === ctrl) { abortRef.current = null; setIsDetecting(false); }
    }
  }, [token, isDetecting]);

  const cancelDetection = useCallback(() => { abortRef.current?.abort(); }, []);

  return (
    <DetectionContext.Provider value={{ currentDetection, isDetecting, detectFromText, detectFromImage, cancelDetection, setCurrentDetection }}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetection must be used within DetectionProvider');
  return context;
}
