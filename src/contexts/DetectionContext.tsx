import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Detection } from '@/types';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ApiResponse } from '@/types';
import { useAuth } from './AuthContext';

interface DetectionContextType {
  currentDetection: Detection | null;
  isDetecting: boolean;
  detectFromText: (text: string) => Promise<Detection>;
  detectFromImage: (file: File) => Promise<Detection>;
  setCurrentDetection: (detection: Detection | null) => void;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export function DetectionProvider({ children }: { children: ReactNode }) {
  const [currentDetection, setCurrentDetection] = useState<Detection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { token } = useAuth();

  const detectFromText = useCallback(async (text: string): Promise<Detection> => {
    setIsDetecting(true);
    try {
      const res = await api.post<ApiResponse<Detection>>(
        API_ENDPOINTS.DETECTIONS.TEXT,
        { text },
        token || undefined
      );
      setCurrentDetection(res.data);
      return res.data;
    } finally {
      setIsDetecting(false);
    }
  }, [token]);

  const detectFromImage = useCallback(async (file: File): Promise<Detection> => {
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<ApiResponse<Detection>>(
        API_ENDPOINTS.DETECTIONS.UPLOAD,
        formData,
        token || undefined,
        true
      );
      setCurrentDetection(res.data);
      return res.data;
    } finally {
      setIsDetecting(false);
    }
  }, [token]);

  return (
    <DetectionContext.Provider
      value={{
        currentDetection,
        isDetecting,
        detectFromText,
        detectFromImage,
        setCurrentDetection,
      }}
    >
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetection must be used within DetectionProvider');
  return context;
}
