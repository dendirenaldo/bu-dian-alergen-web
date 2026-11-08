import { createContext, useContext, useRef, useState, useCallback, ReactNode, useEffect } from 'react';
import { Detection, DetectionModelChoice, PublicQuota } from '@/types';
import { api, formatApiErrorMessage, newIdempotencyKey, isApiError } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { ApiResponse } from '@/types';
import { unwrapData } from '@/lib/unwrap';
import { useAuth } from './AuthContext';

const ANON_KEY = 'anon_id';
const MODEL_KEY = 'detection_model';
export const DEFAULT_MODEL: DetectionModelChoice = 'bert';

/** Batas tunggu SSE di sisi klien (backend menunggu maks 120 dtk). */
const SSE_TIMEOUT_MS = 125_000;

function getAnonId(): string | undefined {
  try {
    const v = localStorage.getItem(ANON_KEY);
    if (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return v;
  } catch { /* abaikan */ }
  return undefined;
}

function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
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

/** Satu event SSE kontrak backend: { stage, progress, message, etaMs?, data? }. */
export interface SseDetectionEvent {
  stage: string;
  progress: number;
  message: string;
  etaMs?: number;
  data?: any;
}

function parseSsePayload(raw: string): SseDetectionEvent | null {
  const text = raw.trim();
  if (!text || text.startsWith(':')) return null;
  // Format backend: "data: {...}". Ambil baris data:.
  const lines = text.split('\n');
  const dataLines: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('data:')) dataLines.push(t.slice(5).trim());
    else if (t.startsWith(':')) continue;
  }
  const joined = dataLines.length > 0 ? dataLines.join('\n') : text;
  try {
    const obj = JSON.parse(joined);
    if (obj && typeof obj.stage === 'string' && typeof obj.progress === 'number') {
      return obj as SseDetectionEvent;
    }
    return null;
  } catch {
    return null;
  }
}

function buildStreamUrl(uploadId: string, anonId?: string): string {
  const base = `${API_BASE_URL}${API_ENDPOINTS.DETECTIONS.STREAM}`;
  const params = new URLSearchParams({ uploadId });
  if (anonId) params.set('anonId', anonId);
  return `${base}?${params.toString()}`;
}

function extractDetectionFromSseData(data: any): Detection | null {
  if (!data || typeof data !== 'object') return null;
  const candidate = (data as any).result ?? data;
  if (candidate && typeof candidate === 'object' && typeof (candidate as any).id === 'number') {
    return candidate as Detection;
  }
  return null;
}

type PendingRequest =
  | { kind: 'text'; text: string; model: DetectionModelChoice }
  | { kind: 'image'; file: File; model: DetectionModelChoice };

interface DetectionContextType {
  currentDetection: Detection | null;
  isDetecting: boolean;
  selectedModel: DetectionModelChoice;
  setSelectedModel: (m: DetectionModelChoice) => void;
  quota: PublicQuota | null;
  /** Pesan error non-blokir saat kuota tamu gagal dimuat. */
  quotaError: string | null;
  refreshQuota: () => Promise<void>;
  detectFromText: (text: string, model?: DetectionModelChoice) => Promise<Detection>;
  detectFromImage: (file: File, model?: DetectionModelChoice) => Promise<Detection>;
  cancelDetection: () => void;
  setCurrentDetection: (detection: Detection | null) => void;
  /** Progres SSE 0-1 (null bila idle). */
  progress: number | null;
  /** Tahap mentah backend (received, ml_ocr, done, ...). */
  currentStage: string | null;
  /** Pesan mentah backend untuk tahap berjalan. */
  stageMessage: string | null;
  /** Estimasi sisa waktu (ms) dari event SSE, bila ada. */
  etaMs: number | null;
  /** ID job backend (header X-Job-Id). Dipakai untuk stream + cancel. */
  jobId: string | null;
  /** Notice fallback model (header X-Model-Fallback / event SSE). */
  fallbackNotice: string | null;
  /** Peringatan kualitas OCR rendah (blur/coverage). Null bila kualitas baik. */
  qualityWarning: string | null;
  /** Hitung mundur 429 (detik) dari header Retry-After. */
  retryAfterSec: number | null;
  /** Ulangi permintaan terakhir dengan Idempotency-Key yang SAMA. */
  retryLastDetection: () => Promise<Detection>;
  /** True bila ada permintaan terakhir yang bisa diulang. */
  canRetry: boolean;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export function DetectionProvider({ children }: { children: ReactNode }) {
  const [currentDetection, setCurrentDetection] = useState<Detection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedModel, setSelectedModelState] = useState<DetectionModelChoice>(DEFAULT_MODEL);
  const [quota, setQuota] = useState<PublicQuota | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [etaMs, setEtaMs] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const doneRef = useRef(false);
  const lastRequestRef = useRef<PendingRequest | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const { token } = useAuth();
  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

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
    if (token) { setQuota(null); setQuotaError(null); return; }
    try {
      const anonId = ensureAnonId();
      const res = await api.get<{ data: PublicQuota } | PublicQuota>(
        API_ENDPOINTS.DETECTIONS.PUBLIC_QUOTA, undefined, undefined, anonId,
      );
      const q = (res as any)?.data ?? res;
      if (typeof q?.remaining === 'number') {
        setQuota(q as PublicQuota);
        setQuotaError(null);
      }
    } catch (err) {
      // Non-blokir: deteksi tetap jalan, tapi tampilkan pesan agar tidak gagal diam-diam.
      setQuotaError(formatApiErrorMessage(err));
    }
  }, [token]);

  useEffect(() => {
    if (!token) void refreshQuota();
    else setQuota(null);
  }, [token, refreshQuota]);

  // Bersihkan SSE / fetch stream yang masih terbuka saat unmount.
  useEffect(() => {
    return () => {
      try { eventSourceRef.current?.close(); } catch { /* abaikan */ }
      eventSourceRef.current = null;
      try { streamAbortRef.current?.abort(); } catch { /* abaikan */ }
      streamAbortRef.current = null;
      try { abortRef.current?.abort(); } catch { /* abaikan */ }
    };
  }, []);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch { /* abaikan */ }
      eventSourceRef.current = null;
    }
    if (streamAbortRef.current) {
      try { streamAbortRef.current.abort(); } catch { /* abaikan */ }
      streamAbortRef.current = null;
    }
  }, []);

  const applySseEvent = useCallback((ev: SseDetectionEvent) => {
    const p = typeof ev.progress === 'number' && Number.isFinite(ev.progress)
      ? Math.min(1, Math.max(0, ev.progress / 100))
      : null;
    setProgress(p);
    setCurrentStage(ev.stage);
    setStageMessage(ev.message);
    setEtaMs(typeof ev.etaMs === 'number' && Number.isFinite(ev.etaMs) ? ev.etaMs : null);
    const fb = (ev.data as any)?.fallbackNotice;
    if (typeof fb === 'string' && fb.trim()) setFallbackNotice(fb.trim());
    else if (fb && typeof fb === 'object') setFallbackNotice('bilstm');
    const oq = (ev.data as any)?.ocrQuality;
    if (oq && typeof oq === 'object' && (oq as any).lowQuality) {
      setQualityWarning('low');
    }
  }, []);

  /**
   * Buka GET /detections/stream?uploadId=... via EventSource.
   * EventSource tidak bisa menyetel header, jadi anonId dikirim via query
   * dan kredensial cookie ikut via withCredentials (api.ts memakai
   * credentials:include). Bila EventSource gagal, fallback ke fetch streaming.
   */
  const subscribeSse = useCallback((uploadId: string, anonId: string | undefined, onEvent: (ev: SseDetectionEvent) => void, signal: AbortSignal): Promise<void> => {
    const url = buildStreamUrl(uploadId, anonId);
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      const onAbort = () => { try { eventSourceRef.current?.close(); } catch { /* abaikan */ } finish(); };
      if (signal.aborted) { finish(); return; }
      signal.addEventListener('abort', onAbort, { once: true });

      let es: EventSource | null = null;
      try {
        es = new EventSource(url, { withCredentials: true } as any);
      } catch {
        es = null;
      }
      if (!es) {
        signal.removeEventListener('abort', onAbort);
        finish();
        return;
      }
      eventSourceRef.current = es;
      // Timeout pengaman: jangan gantung selamanya.
      const timer = setTimeout(() => {
        try { es?.close(); } catch { /* abaikan */ }
        if (eventSourceRef.current === es) eventSourceRef.current = null;
        signal.removeEventListener('abort', onAbort);
        finish();
      }, SSE_TIMEOUT_MS);

      es.onmessage = (e: MessageEvent) => {
        const ev = parseSsePayload(String((e as any)?.data ?? ''));
        if (!ev) return;
        onEvent(ev);
        if (ev.stage === 'done' || ev.stage === 'error') {
          clearTimeout(timer);
          try { es?.close(); } catch { /* abaikan */ }
          if (eventSourceRef.current === es) eventSourceRef.current = null;
          signal.removeEventListener('abort', onAbort);
          finish();
        }
      };
      es.onerror = () => {
        // Biarkan onmessage 'done'/'error' menutup; bila koneksi gagal
        // sebelum event apapun, tutup dan serahkan ke fallback fetch.
        clearTimeout(timer);
        try { es?.close(); } catch { /* abaikan */ }
        if (eventSourceRef.current === es) eventSourceRef.current = null;
        signal.removeEventListener('abort', onAbort);
        finish();
      };
    });
  }, []);

  /** Fallback polling/streaming via fetch bila EventSource gagal (bisa kirim header auth). */
  const subscribeSseViaFetch = useCallback(async (
    uploadId: string,
    opts: { token?: string; anonId?: string; signal: AbortSignal },
    onEvent: (ev: SseDetectionEvent) => void,
  ): Promise<boolean> => {
    const url = buildStreamUrl(uploadId, opts.anonId);
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
    if (opts.anonId) headers['x-anon-id'] = opts.anonId;
    const ctrl = new AbortController();
    streamAbortRef.current = ctrl;
    const linkedAbort = () => ctrl.abort();
    opts.signal.addEventListener('abort', linkedAbort, { once: true });
    let sawEvent = false;
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal, credentials: 'include' });
      if (!res.ok || !res.body) return false;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const deadline = Date.now() + SSE_TIMEOUT_MS;
      for (;;) {
        if (Date.now() > deadline) break;
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // Pecah per event "\n\n".
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = parseSsePayload(chunk);
          if (!ev) continue;
          sawEvent = true;
          onEvent(ev);
          if (ev.stage === 'done' || ev.stage === 'error') {
            try { await reader.cancel(); } catch { /* abaikan */ }
            return true;
          }
        }
      }
      // Sisa buffer terakhir.
      const tail = parseSsePayload(buf);
      if (tail) { sawEvent = true; onEvent(tail); }
      return sawEvent;
    } catch {
      return sawEvent;
    } finally {
      opts.signal.removeEventListener('abort', linkedAbort);
      if (streamAbortRef.current === ctrl) streamAbortRef.current = null;
    }
  }, []);

  const postWithBertFallback = useCallback(async (
    endpoint: string,
    body: any,
    model: DetectionModelChoice,
    opts: { isFormData?: boolean; signal?: AbortSignal; anonId?: string; idempotencyKey?: string },
  ): Promise<{ body: ApiResponse<Detection>; headers: Headers; status: number; fallbackUsed: boolean }> => {
    const url = (m: string) => `${endpoint}?model=${encodeURIComponent(m)}`;
    const primaryKey = opts.idempotencyKey ?? newIdempotencyKey();
    try {
      const res = await api.postWithHeaders<ApiResponse<Detection>>(url(model), body, tokenRef.current || undefined, {
        signal: opts.signal, idempotencyKey: primaryKey, isFormData: opts.isFormData, anonId: opts.anonId,
      });
      const fb = res.headers.get('X-Model-Fallback') ?? res.headers.get('x-model-fallback');
      return { body: res.data, headers: res.headers, status: res.status, fallbackUsed: !!fb };
    } catch (err: any) {
      if (model !== 'bilstm' && err?.statusCode === 503) {
        const res = await api.postWithHeaders<ApiResponse<Detection>>(url('bilstm'), body, tokenRef.current || undefined, {
          signal: opts.signal, idempotencyKey: newIdempotencyKey(), isFormData: opts.isFormData, anonId: opts.anonId,
        });
        return { body: res.data, headers: res.headers, status: res.status, fallbackUsed: true };
      }
      throw err;
    }
  }, []);

  const runDetection = useCallback(async (
    pending: PendingRequest,
    idempotencyKey: string,
  ): Promise<Detection> => {
    abortRef.current?.abort();
    closeStream();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    doneRef.current = false;
    setIsDetecting(true);
    setProgress(0);
    setCurrentStage('received');
    setStageMessage(null);
    setEtaMs(null);
    setJobId(null);
    jobIdRef.current = null;
    setFallbackNotice(null);
    setQualityWarning(null);
    setRetryAfterSec(null);

    const anonId = tokenRef.current ? undefined : ensureAnonId();
    const endpoint = pending.kind === 'text'
      ? (tokenRef.current ? API_ENDPOINTS.DETECTIONS.TEXT : API_ENDPOINTS.DETECTIONS.PUBLIC_TEXT)
      : (tokenRef.current ? API_ENDPOINTS.DETECTIONS.UPLOAD : API_ENDPOINTS.DETECTIONS.PUBLIC_UPLOAD);

    let body: any;
    if (pending.kind === 'text') {
      body = { text: pending.text };
    } else {
      const fd = new FormData();
      fd.append('image', pending.file);
      body = fd;
    }

    const finishOk = (d: Detection): Detection => {
      if (doneRef.current) return d;
      doneRef.current = true;
      setCurrentDetection(d);
      setProgress(1);
      setCurrentStage((s) => s ?? 'done');
      return d;
    };

    try {
      // (a) POST seperti biasa, tangkap X-Job-Id dari header respons.
      let postResult: Detection | null = null;
      let respHeaders: Headers | null = null;
      let respStatus = 200;
      try {
        const res = await postWithBertFallback(endpoint, body, pending.model, {
          isFormData: pending.kind === 'image',
          signal: ctrl.signal,
          anonId,
          idempotencyKey,
        });
        respHeaders = res.headers;
        respStatus = res.status;
        if (res.fallbackUsed) setFallbackNotice((v) => v ?? 'bilstm');
        postResult = unwrapData<Detection>(res.body);
      } catch (err: any) {
        if (isApiError(err) && typeof err.retryAfterSec === 'number') {
          setRetryAfterSec(err.retryAfterSec);
        } else if (err?.statusCode === 429) {
          const raw = (err as any)?.raw;
          const ra = Number((raw as any)?.retryAfter ?? (raw as any)?.retry_after);
          if (Number.isFinite(ra)) setRetryAfterSec(Math.max(0, Math.floor(ra)));
        }
        throw err;
      }

      const headerJobId = respHeaders?.get('X-Job-Id') ?? respHeaders?.get('x-job-id');
      const uploadId = (headerJobId ?? '').trim();
      // 202/pending ATAU selalu: bila ada job id, buka SSE untuk progres.
      if (uploadId || respStatus === 202) {
        const id = uploadId;
        if (id) {
          jobIdRef.current = id;
          setJobId(id);
        }
        let sseResult: Detection | null = null;
        let sseError: string | null = null;
        const onEvent = (ev: SseDetectionEvent) => {
          applySseEvent(ev);
          if (ev.stage === 'done') {
            sseResult = extractDetectionFromSseData(ev.data);
          } else if (ev.stage === 'error') {
            sseError = ev.message || 'Deteksi gagal';
          }
        };
        // Coba EventSource dulu, lalu fallback fetch bila tak ada event.
        let sawDone = false;
        try {
          await subscribeSse(id || 'pending', anonId, (ev) => {
            onEvent(ev);
            if (ev.stage === 'done' || ev.stage === 'error') sawDone = true;
          }, ctrl.signal);
        } catch { /* lanjut ke fallback */ }
        if (!sawDone && !ctrl.signal.aborted && id) {
          try {
            await subscribeSseViaFetch(id, { token: tokenRef.current || undefined, anonId, signal: ctrl.signal }, onEvent);
          } catch { /* abaikan, pakai hasil POST */ }
        }
        if (ctrl.signal.aborted) {
          throw new DOMException('Dibatalkan', 'AbortError');
        }
        if (sseError && !sseResult && !postResult) {
          throw new Error(sseError);
        }
        const finalResult = sseResult ?? postResult;
        if (!finalResult) throw new Error('Deteksi gagal: hasil kosong.');
        const done = finishOk(finalResult);
        if (!tokenRef.current) void refreshQuota();
        return done;
      }

      // Tanpa job id (backend lama): pakai hasil POST langsung.
      if (!postResult) throw new Error('Deteksi gagal: hasil kosong.');
      const done = finishOk(postResult);
      if (!tokenRef.current) void refreshQuota();
      return done;
    } finally {
      closeStream();
      if (abortRef.current === ctrl) { abortRef.current = null; setIsDetecting(false); }
    }
  }, [applySseEvent, closeStream, postWithBertFallback, refreshQuota, subscribeSse, subscribeSseViaFetch]);

  const detectFromText = useCallback(async (text: string, model?: DetectionModelChoice): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    const m = model ?? selectedModel;
    const key = newIdempotencyKey();
    lastRequestRef.current = { kind: 'text', text, model: m };
    lastKeyRef.current = key;
    setCanRetry(true);
    return runDetection(lastRequestRef.current, key);
  }, [isDetecting, selectedModel, runDetection]);

  const detectFromImage = useCallback(async (file: File, model?: DetectionModelChoice): Promise<Detection> => {
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    const m = model ?? selectedModel;
    const key = newIdempotencyKey();
    lastRequestRef.current = { kind: 'image', file, model: m };
    lastKeyRef.current = key;
    setCanRetry(true);
    return runDetection(lastRequestRef.current, key);
  }, [isDetecting, selectedModel, runDetection]);

  /** Ulangi permintaan terakhir dengan Idempotency-Key yang SAMA. */
  const retryLastDetection = useCallback(async (): Promise<Detection> => {
    const pending = lastRequestRef.current;
    const key = lastKeyRef.current;
    if (!pending || !key) throw new Error('Belum ada deteksi yang bisa diulang.');
    if (isDetecting) throw new Error('Deteksi sedang berjalan. Tunggu hingga selesai.');
    return runDetection(pending, key);
  }, [isDetecting, runDetection]);

  const cancelDetection = useCallback(() => {
    closeStream();
    try { streamAbortRef.current?.abort(); } catch { /* abaikan */ }
    abortRef.current?.abort();
    const id = jobIdRef.current;
    jobIdRef.current = null;
    setProgress(null);
    setCurrentStage('cancelled');
    setStageMessage(null);
    setEtaMs(null);
    setJobId(null);
    // DELETE job backend (cancel + refund kuota). Fire-and-forget.
    if (id) {
      const anonId = tokenRef.current ? undefined : getAnonId();
      void api.delete(API_ENDPOINTS.DETECTIONS.JOB_CANCEL(id), tokenRef.current || undefined, { anonId })
        .catch(() => undefined)
        .finally(() => { if (!tokenRef.current) void refreshQuota(); });
    }
  }, [closeStream, refreshQuota]);

  return (
    <DetectionContext.Provider value={{ currentDetection, isDetecting, selectedModel, setSelectedModel, quota, quotaError, refreshQuota, detectFromText, detectFromImage, cancelDetection, setCurrentDetection, progress, currentStage, stageMessage, etaMs, jobId, fallbackNotice, qualityWarning, retryAfterSec, retryLastDetection, canRetry }}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error('useDetection must be used within DetectionProvider');
  return context;
}
