import { ReactElement, useState } from 'react';
import Head from 'next/head';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import ImageUploader from '@/components/detection/ImageUploader';
import DetectionResult from '@/components/detection/DetectionResult';
import { useDetection } from '@/contexts/DetectionContext';
import { ShieldCheck } from 'lucide-react';

export default function DetectPage() {
  const { isDetecting, currentDetection, detectFromImage } = useDetection();
  const [error, setError] = useState('');

  const handleImageSelect = async (file: File) => {
    setError('');
    try {
      await detectFromImage(file);
    } catch (err: any) {
      setError(err.message || 'Gagal mendeteksi. Silakan coba lagi.');
    }
  };

  return (
    <>
      <Head>
        <title>Deteksi Alergen - Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                Deteksi Alergen
              </h1>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Upload foto label produk makanan untuk mendeteksi alergen.
              </p>
            </div>

            <ImageUploader onImageSelect={handleImageSelect} isProcessing={isDetecting} />

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
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
