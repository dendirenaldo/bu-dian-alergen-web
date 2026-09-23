import { createContext, useContext, useRef, useState, useCallback, ReactNode, useEffect } from 'react';
import { Detection, DetectionModelChoice, PublicQuota } from '@/types';
import { api, newIdempotencyKey } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ApiResponse } from '@/types';
import { unwrapData } from '@/lib/unwrap';
import { useAuth } from './AuthContext';

const ANON_KEY = 'anon_id';
const MODEL_KEY = 'detection_model';
export const DEFAULT_MODEL: DetectionModelChoice = 'bert';

function getAnonId(): string | undefined {
  try {
    const v = localStorage.getItem(ANON_KEY);
    if (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return v;
  } catch { /* abaikan */ }
  return undefined;
}

function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback RFC4122 v4 manual (valid UUID, bukan Date.now-random).
  const r = () => Math.floor(Math.random() * 16).toString(16);
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const v = c === 'x' ? parseInt(r(), 16) : (parseInt(r(), 16) & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureAnonId(): string {
  let v = getAnonId();
  if (!v) {
    v = newUuid();
    try { localStorage.setItem(ANON_KEY, v); } catch { /* abaikan */ }
  }
  return v;
}

interface DetectionContextType {
  currentDetection: Detection | null;
  isDetecting: boolean;
  selectedModel: DetectionModelChoice;
  setSelectedModel: (m: DetectionModelChoice) => void;
  quota: PublicQuota | null;
  refreshQuota: () => Promise<void>;
  detectFromText: (text: string, model?: DetectionModelChoice) => Promise<Detection>;
  detectFromImage: (file: File, model?: DetectionModelChoice) => Promise<Detection>;
  cancelDetection: () => void;
  setCurrentDetection: (detection: Detection | null) => void;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export function DetectionProvider({ children }: { children: ReactNode }) {
  const [currentDetection, setCurrentDetection] = useState<Detection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedModel, setSelectedModelState] = useState<DetectionModelChoice>(DEFAULT_MODEL);
  const [quota, setQuota] = useState<PublicQuota | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      if (saved === 'bilstm' || saved === 'bert' || saved === 'ensemble') {
        setSelectedModelState(saved);
      }
    } catch { /* abaikan */ }
  }, []);

  const setSelectedModel = useCallback((m: DetectionModelChoice) => {
    setSelectedModelState(m);
    try { localStorage.setItem(MODEL_KEY, m); } catch { /* abaikan */ }
  }, []);

  const refreshQuota = useCallback(async () => {
    if (token) { setQuota(null); return; }
    try {
      const anonId = ensureAnonId();
      const res = await api.get<{ data: PublicQuota } | PublicQuota>(
        API_ENDPOINTS.DETECTIONS.PUBLIC_QUOTA, undefined, undefined, anonId,
      );
      const q = (res as any)?.data ?? res;
      if (typeof q?.remaining === 'number') setQuota(q as PublicQuota);
    } catch { /* kuota gagal dimuat: jangan blokir deteksi */ }
  }, [token]);

  useEffect(() => {
    if (!token) void refreshQuota();
    else setQuota(null);
  }, [token, refreshQuota]);

  const postWithBertFallback = useCallback(async (
    endpoint: string,
    body: any,
    model: DetectionModelChoice,
    opts: { isFormData?: boolean; signal?: AbortSignal; anonId?: string },
  ) => {
    const url = (m: string) => `${endpoint}?model=${encodeURIComponent(m)}`;
    try {
      return await api.post<ApiResponse<Detection>>(url(model), body, token || undefined, {
        signal: opts.signal, idempotencyKey: newIdempotencyKey(), isFormData: opts.isFormData, anonId: opts.anonId,
      });
    } catch (err: any) {
      // Model bert/ensemble belum tersedia di server (503) → coba sekali dengan bilstm.
      if (model !== 'bilstm' && err?.statusCode === 503) {
        return await api.post<ApiResponse<Detection>>(url('bilstm'), body, token || undefined, {
          signal: opts.signal, idempotencyKey: newIdempotencyKey(), isFormData: opts.isFormData, anonId: opts.anonId,
        });
      }
      throw err;
    }
  }, [token]);

  const detectFromText = useCallback(async (text: string, model?: DetectionModelChoice): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsDetecting(true);
    try {
      const m = model ?? selectedModel;
      const endpoint = token ? API_ENDPOINTS.DETECTIONS.TEXT : API_ENDPOINTS.DETECTIONS.PUBLIC_TEXT;
      const anonId = token ? undefined : ensureAnonId();
      const res = await postWithBertFallback(endpoint, { text }, m, { signal: ctrl.signal, anonId });
      const data = unwrapData<Detection>(res);
      setCurrentDetection(data);
      if (!token) void refreshQuota();
      return data;
    } finally {
      if (abortRef.current === ctrl) { abortRef.current = null; setIsDetecting(false); }
    }
  }, [token, isDetecting, selectedModel, refreshQuota, postWithBertFallback]);

  const detectFromImage = useCallback(async (file: File, model?: DetectionModelChoice): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsDetecting(true);
    try {
      const m = model ?? selectedModel;
      const endpoint = token ? API_ENDPOINTS.DETECTIONS.UPLOAD : API_ENDPOINTS.DETECTIONS.PUBLIC_UPLOAD;
      const anonId = token ? undefined : ensureAnonId();
      const formData = new FormData();
      formData.append('image', file);
      const res = await postWithBertFallback(endpoint, formData, m, { isFormData: true, signal: ctrl.signal, anonId });
      const data = unwrapData<Detection>(res);
      setCurrentDetection(data);
      if (!token) void refreshQuota();
      return data;
    } finally {
      if (abortRef.current === ctrl) { abortRef.current = null; setIsDetecting(false); }
    }
  }, [token, isDetecting, selectedModel, refreshQuota, postWithBertFallback]);

  const cancelDetection = useCallback(() => { abortRef.current?.abort(); }, []);

  return (
    <DetectionContext.Provider value={{ currentDetection, isDetecting, selectedModel, setSelectedModel, quota, refreshQuota, detectFromText, detectFromImage, cancelDetection, setCurrentDetection }}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetection must be used within DetectionProvider');
  return context;
}
