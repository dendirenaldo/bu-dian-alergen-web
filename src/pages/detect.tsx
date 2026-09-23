import { ReactElement, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import ImageUploader from '@/components/detection/ImageUploader';
import DetectionResult from '@/components/detection/DetectionResult';
import { useDetection } from '@/contexts/DetectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { useLocale } from '@/contexts/LocaleContext';
import { DetectionModelChoice } from '@/types';

const MODELS: { value: DetectionModelChoice; label: string; descId: string; descEn: string }[] = [
  { value: 'bert', label: 'BERT', descId: 'Akurasi tertinggi', descEn: 'Highest accuracy' },
  { value: 'bilstm', label: 'BiLSTM', descId: 'Cepat', descEn: 'Fast' },
  { value: 'ensemble', label: 'Ensemble', descId: 'Gabungan keduanya', descEn: 'Combined' },
];

export default function DetectPage() {
  const { t, locale } = useLocale();
  const { token, isLoading: authLoading } = useAuth();
  const { isDetecting, currentDetection, detectFromImage, detectFromText, selectedModel, setSelectedModel, quota } = useDetection();
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [text, setText] = useState('');

  const handleImageSelect = async (file: File) => {
    setError('');
    try {
      await detectFromImage(file);
    } catch (err: any) {
      setError(err.message || t('api.err.failed'));
    }
  };

  const handleTextDetect = async () => {
    setError('');
    try {
      await detectFromText(text);
    } catch (err: any) {
      setError(err.message || t('api.err.failed'));
    }
  };

  return (
    <>
      <SeoHead title={t('seo.detectTitle')} description={t('seo.detectDesc')} path="/detect" />
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {t('detect.title')}
              </h1>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                {t('detect.subtitle')}
              </p>
              {!authLoading && !token && (
                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                  {quota
                    ? t('detect.guestQuota', { limit: quota.limit ?? 5, remaining: quota.remaining })
                    : t('detect.guestQuotaNoCount', { limit: 5 })}
                </p>
              )}
            </div>

            <Card padding="md" className="mb-4">
              <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                {t('detect.model')}
              </p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('detect.model')}>
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={selectedModel === m.value}
                    onClick={() => setSelectedModel(m.value)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      selectedModel === m.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-surface-900 dark:text-surface-100">{m.label}</span>
                    <span className="block text-xs text-surface-500 dark:text-surface-400">
                      {locale === 'id' ? m.descId : m.descEn}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${mode === 'image' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}
              >
                {t('admin.method.image')}
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${mode === 'text' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}
              >
                {t('admin.method.text')}
              </button>
            </div>

            {mode === 'image' ? (
              <ImageUploader onImageSelect={handleImageSelect} isProcessing={isDetecting} />
            ) : (
              <Card padding="md">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder={locale === 'id' ? 'Masukkan teks komposisi bahan...' : 'Enter ingredient composition text...'}
                  className="w-full rounded-xl border border-surface-200 bg-white p-3 text-sm dark:border-surface-700 dark:bg-surface-900"
                />
                <button
                  type="button"
                  onClick={handleTextDetect}
                  disabled={isDetecting || !text.trim()}
                  className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isDetecting ? t('detect.detecting') : t('detect.title')}
                </button>
              </Card>
            )}

            {error && (
              <div className="mt-4">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            {currentDetection && (
              <div className="mt-6">
                <DetectionResult detection={currentDetection} />
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </>
  );
}

DetectPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
