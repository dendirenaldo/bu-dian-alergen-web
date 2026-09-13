import { ReactElement, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import ImageUploader from '@/components/detection/ImageUploader';
import DetectionResult from '@/components/detection/DetectionResult';
import { useDetection } from '@/contexts/DetectionContext';
import { ShieldCheck } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import { useLocale } from '@/contexts/LocaleContext';

export default function DetectPage() {
  const { t } = useLocale();
  const { isDetecting, currentDetection, detectFromImage } = useDetection();
  const [error, setError] = useState('');

  const handleImageSelect = async (file: File) => {
    setError('');
    try {
      await detectFromImage(file);
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
            </div>

            <ImageUploader onImageSelect={handleImageSelect} isProcessing={isDetecting} />

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
