import { ReactElement, useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import ImageUploader from '@/components/detection/ImageUploader';
import DetectionResult from '@/components/detection/DetectionResult';
import { useDetection } from '@/contexts/DetectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FlaskConical, ShieldCheck } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { useLocale } from '@/contexts/LocaleContext';
import { DetectionModelChoice } from '@/types';
import { formatApiErrorMessage } from '@/lib/api';
import { DEMO_SAMPLE_MAP, isDemoDetection, type DemoSampleKey } from '@/lib/demoSamples';
import { maybeStartGuidedTourAuto, startGuidedTour } from '@/lib/guidedTour';

const MODELS: { value: DetectionModelChoice; label: string; descId: string; descEn: string }[] = [
  { value: 'bert', label: 'BERT', descId: 'Paling teliti', descEn: 'Most thorough' },
  { value: 'bilstm', label: 'BiLSTM', descId: 'Paling cepat', descEn: 'Fastest' },
  { value: 'ensemble', label: 'Ensemble', descId: 'Gabungan keduanya', descEn: 'Combined' },
];

const DEMO_BUTTONS: { key: DemoSampleKey; labelId: string; labelEn: string; hintId: string; hintEn: string }[] = [
  { key: 'safe', labelId: 'Aman • Air mineral', labelEn: 'Safe • Mineral water', hintId: '0,98 • tanpa alergen', hintEn: '0.98 • no allergen' },
  { key: 'dangerous', labelId: 'Berbahaya • Mi instan', labelEn: 'Unsafe • Instant noodles', hintId: '0,92 • parah', hintEn: '0.92 • severe' },
  { key: 'moderate', labelId: 'Sedang • Kue cokelat', labelEn: 'Medium • Choco cookies', hintId: '0,85 • sedang', hintEn: '0.85 • medium' },
];

export default function DetectPage() {
  const { t, locale } = useLocale();
  const { token, isLoading: authLoading } = useAuth();
  const { isDetecting, currentDetection, detectFromImage, detectFromText, selectedModel, setSelectedModel, quota, quotaError, setCurrentDetection } = useDetection();
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [text, setText] = useState('');

  const isDemo = isDemoDetection(currentDetection);

  // Tur panduan otomatis — sekali per browser (localStorage guided_tour_v1).
  useEffect(() => {
    return maybeStartGuidedTourAuto(locale === 'en' ? 'en' : 'id');
  }, [locale]);

  const handleImageSelect = async (file: File) => {
    setError('');
    try {
      await detectFromImage(file);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    }
  };

  const handleTextDetect = async () => {
    setError('');
    try {
      await detectFromText(text);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    }
  };

  /**
   * Mode latihan: hanya set state lokal, TANPA api.post / fetch / kuota.
   * Banner kuning menjelaskan hasil tidak disimpan.
   */
  const handleDemoSelect = (key: DemoSampleKey) => {
    setError('');
    const sample = DEMO_SAMPLE_MAP[key];
    if (sample.detectionMethod === 'text_input') {
      setMode('text');
      setText(sample.ocrText ?? '');
    } else {
      setMode('image');
    }
    setCurrentDetection(sample);
  };

  const handleClearDemo = () => {
    setCurrentDetection(null);
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
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startGuidedTour(locale === 'en' ? 'en' : 'id')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-primary-300 hover:text-primary-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {locale === 'id' ? 'Panduan' : 'Guide'}
                </button>
                <Link
                  href="/"
                  className="hidden text-xs text-surface-400 underline-offset-2 hover:underline sm:inline"
                >
                  {locale === 'id' ? 'Lihat cara kerja' : 'See how it works'}
                </Link>
              </div>
              <div data-tour="quota" className="mt-2">
                {!authLoading && !token && (
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {quota
                      ? t('detect.guestQuota', { limit: quota.limit ?? 5, remaining: quota.remaining })
                      : t('detect.guestQuotaNoCount', { limit: 5 })}
                  </p>
                )}
                {!authLoading && !token && (
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    {locale === 'id' ? (
                      <>
                        Masuk untuk riwayat tak terbatas.{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                          Masuk
                        </Link>{' '}
                        /{' '}
                        <Link href="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                          Daftar
                        </Link>
                      </>
                    ) : (
                      <>
                        Log in for unlimited history.{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                          Log in
                        </Link>{' '}
                        /{' '}
                        <Link href="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                          Register
                        </Link>
                      </>
                    )}
                  </p>
                )}
                {!authLoading && token && (
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {locale === 'id' ? 'Anda masuk — hasil tersimpan di Riwayat.' : 'You are logged in — results are saved to History.'}
                  </p>
                )}
                {!authLoading && !token && quotaError && (
                  <p role="alert" className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    {quotaError}
                  </p>
                )}
              </div>
            </div>

            {/* Mode latihan — 0 HTTP, hanya setCurrentDetection lokal */}
            <Card padding="md" className="mb-4 border-dashed">
              <div className="mb-2 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-surface-500" />
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                  {locale === 'id' ? 'Coba contoh' : 'Try examples'}
                </p>
              </div>
              <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
                {locale === 'id'
                  ? 'Lihat hasil tanpa foto & tanpa kuota. Klik salah satu:'
                  : 'See results without a photo or quota. Click one:'}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DEMO_BUTTONS.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => handleDemoSelect(b.key)}
                    className="rounded-xl border border-surface-200 px-3 py-2 text-left transition hover:border-primary-400 hover:bg-primary-50 dark:border-surface-700 dark:hover:bg-primary-900/10"
                  >
                    <span className="block text-xs font-semibold text-surface-900 dark:text-surface-100">
                      {locale === 'id' ? b.labelId : b.labelEn}
                    </span>
                    <span className="block text-[11px] text-surface-500 dark:text-surface-400">
                      {locale === 'id' ? b.hintId : b.hintEn}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {isDemo && (
              <div className="mb-4">
                <Alert variant="warning" title={locale === 'id' ? 'Mode Latihan — tidak disimpan' : 'Practice Mode — not saved (Mode Latihan — tidak disimpan)'}>
                  <p>
                    {locale === 'id'
                      ? 'Ini contoh buatan. Hasil tidak dikirim ke server, tidak masuk Riwayat, dan tidak mengurangi kuota.'
                      : 'This is a mock example. The result is not sent to the server, not saved to History, and does not use quota.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearDemo}
                    className="mt-2 text-xs font-medium underline underline-offset-2"
                  >
                    {locale === 'id' ? 'Tutup contoh, mulai periksa asli' : 'Close example, start a real check'}
                  </button>
                </Alert>
              </div>
            )}

            <Card padding="md" className="mb-4" data-tour="model-card">
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
                data-tour="tab-image"
                onClick={() => setMode('image')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${mode === 'image' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}
              >
                {t('admin.method.image')}
              </button>
              <button
                type="button"
                data-tour="tab-text"
                onClick={() => setMode('text')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${mode === 'text' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}
              >
                {t('admin.method.text')}
              </button>
            </div>

            {mode === 'image' ? (
              <div data-tour="dropzone">
                <ImageUploader onImageSelect={handleImageSelect} isProcessing={isDetecting} />
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/10 dark:text-green-300">
                    <p className="mb-1 font-semibold">
                      {locale === 'id' ? '✅ Contoh baik' : '✅ Good example'}
                    </p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      <li>{locale === 'id' ? 'Foto tegak, fokus, terang' : 'Upright, focused, bright photo'}</li>
                      <li>{locale === 'id' ? 'Seluruh daftar bahan terlihat' : 'Full ingredient list visible'}</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">
                    <p className="mb-1 font-semibold">
                      {locale === 'id' ? '❌ Contoh buruk' : '❌ Bad example'}
                    </p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      <li>{locale === 'id' ? 'Buram, miring, atau gelap' : 'Blurry, tilted, or dark'}</li>
                      <li>{locale === 'id' ? 'Teks terpotong / tidak terbaca' : 'Text cropped / unreadable'}</li>
                    </ul>
                  </div>
                </div>
                <p data-tour="detect-button" className="mt-3 text-center text-xs text-surface-500 dark:text-surface-400">
                  {locale === 'id'
                    ? 'Foto langsung diperiksa otomatis setelah dipilih — tidak perlu tombol tambahan.'
                    : 'Photos are checked automatically after selection — no extra button needed.'}
                </p>
              </div>
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
                  data-tour="detect-button"
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

            <div data-tour="result" className="mt-6">
              {currentDetection ? (
                <>
                  <DetectionResult detection={currentDetection} />
                  <p className="mt-3 rounded-xl bg-surface-100 p-3 text-xs leading-relaxed text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                    {locale === 'id'
                      ? 'Catatan: hasil ini hanya perkiraan awal, bukan vonis medis. Selalu baca ulang label kemasan dan konsultasikan ke dokter bila Anda punya alergi serius.'
                      : 'Note: this result is only an early estimate, not a medical diagnosis. Always re-check the package label and consult a doctor if you have a serious allergy.'}
                  </p>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-surface-200 p-4 text-center text-xs text-surface-400 dark:border-surface-700 dark:text-surface-500">
                  {locale === 'id'
                    ? 'Hasil akan muncul di sini setelah Anda memilih foto, menekan Periksa, atau mencoba contoh latihan di atas.'
                    : 'Results will appear here after you pick a photo, press Check, or try a practice example above.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

DetectPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
